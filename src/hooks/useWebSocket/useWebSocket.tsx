import * as React from 'react';

import { useIntervalCallback } from '@hooks/useTimerCallbacks';
import { getThrowableError } from '@utils/getThrowableError';

import type {
  UseWebSocketProperties,
  BindHandlersFunction,
  WebSocketState,
  WebSocketInstanceType,
  Reducer,
  Dispatch,
  InitialState,
  GenericMessageFromServer,
  WebSocketNativeError,
} from './types';

const voidFunction = ((): void => undefined) as any;

const WebSocketError = getThrowableError(
  'WebSocketError',
  (userMessage: string, details?: { originalError?: Error }) => ({
    userMessage,
    originalError: details?.originalError || undefined,
  }),
);

const useHandlers: BindHandlersFunction = (
  { send, dispatch },
  { onMessage, onOpen, onClose },
) => {
  const onOpenHandler = React.useCallback(() => {
    console.log('-------> client.onopen');

    if (onOpen) {
      console.log('---> call onOpen ');
      onOpen({ send });
    }
    console.log('--> send dispatch');
    dispatch({ type: 'SET_CONNECTED', payload: { value: true } });
  }, [send, onOpen, dispatch]);

  const onMessageHandler = React.useCallback(
    ({ data }: { data?: string }): void => {
      if (!onMessage) {
        throw new WebSocketError('onMessageReceive handler is null.');
      }

      if (!data) {
        return;
      }

      try {
        const decoded = JSON.parse(data);
        onMessage(decoded);
      } catch (err: unknown) {
        throw new WebSocketError(
          'onMessageReceive: could not decode JSON-parsed data!',
        );
      }
    },
    [onMessage],
  );

  const onCloseHandler = React.useCallback(() => {
    console.log('*** client.onClose');
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const onErrorHandler = React.useCallback((error: WebSocketNativeError) => {
    console.log('*** client.onerror:', error);
    // {"isTrusted": false, "message": "The operation couldn’t be completed. Network is down"}
  }, []);

  return React.useMemo(
    () => ({
      onOpen: onOpenHandler,
      onClose: onCloseHandler,
      onError: onErrorHandler,
      onMessage: onMessageHandler,
    }),
    [onOpenHandler, onCloseHandler, onErrorHandler, onMessageHandler],
  );
};

const INITIAL_STATE = {
  isLoading: true,
  isConnected: false,
  isConnecting: false,
};

type WebSocketStateActions = 'SET_LOADING' | 'SET_CONNECTED' | 'SET_CONNECTING';

const webSocketStateReducer = (
  state: WebSocketState,
  action: { type: WebSocketStateActions; payload: any },
) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: !!action.payload.value };
      break;

    case 'SET_CONNECTED':
      return { ...state, isConnected: !!action.payload.value };
      break;

    case 'SET_CONNECTING':
      return {
        ...state,
        isConnecting: !!action.payload.value,
        isLoading: true,
      };
      break;

    default:
      throw new Error(
        'webSocketStateReducer: unknown action type <' + action.type + '>',
      );
      break;
  }
};

export const useWebSocketReducer = (
  initialState: InitialState = INITIAL_STATE,
): [WebSocketState, Dispatch] =>
  React.useReducer<Reducer>(
    webSocketStateReducer,
    initialState as WebSocketState,
  );

const useWebSocket = <
  MFS extends GenericMessageFromServer = GenericMessageFromServer,
>(
  props: UseWebSocketProperties<MFS>,
): WebSocketInstanceType => {
  const ref = React.useRef<WebSocket>(null);

  const {
    uri,
    onMessage = voidFunction,
    onOpen = voidFunction,
    onClose = voidFunction,
    onError = voidFunction,
    autoReconnect = true,
    reconnectCheckIntervalMs = 5000,
  } = props;

  const [state, dispatch] = useWebSocketReducer(() => INITIAL_STATE);

  const send = React.useCallback(async (obj: any): Promise<boolean> => {
    console.log('[WS] send: ', obj);
    if (!ref.current) {
      throw new WebSocketError('[useWebSocket] client is not ready');
    }

    try {
      const encoded = JSON.stringify(obj);
      const result = ref.current.send(encoded) as void | boolean;
      return result === undefined ? true : result;
    } catch (err) {
      throw new WebSocketError(
        '[useWebSocket] error serializing JSON data.',
        err,
      );
    }
  }, []);

  const onLocalClose = React.useCallback(() => {
    if (!reconnectTimer.isStarted()) {
      console.log('call reconnectTimer!');
      reconnectTimer.start();
    }
    onClose();
  }, [reconnectTimer, onClose]);

  const onLocalOpen = React.useCallback(() => {
    if (reconnectTimer.isStarted()) {
      reconnectTimer.finish();
    }
    onOpen({ send });
  }, [reconnectTimer, onOpen, send]);

  const handlers = useHandlers(
    { send, dispatch },
    {
      onMessage,
      onOpen: onLocalOpen,
      onClose: onLocalClose,
      onError,
    },
  );

  const connect = React.useCallback(async (): Promise<boolean> => {
    console.log('CONNECT!!!!!! -> ', uri);
    dispatch({ type: 'SET_CONNECTED', payload: { value: true } });
    ref.current = new WebSocket(uri) as WebSocketInstanceType;
    console.log('[WS] defining handlers');
    if (ref.current) {
      ref.current.onopen = handlers.onOpen;
      ref.current.onmessage = handlers.onMessage;
      ref.current.onclose = handlers.onClose;
      ref.current.onerror = handlers.onError;

      return true;
    } else {
      throw new WebSocketError('Unexpected connect error.');
    }
  }, [
    uri,
    dispatch,
    handlers.onOpen,
    handlers.onMessage,
    handlers.onClose,
    handlers.onError,
  ]);

  React.useEffect(() => {
    return () => {
      console.log('[WS] closing connection');
      if (ref.current) {
        ref.current.close();
        ref.current.onopen = null;
        ref.current.onerror = null;
        ref.current.onmessage = null;
        ref.current.onclose = null;
        ref.current = undefined;
      }
    };
  }, []);

  const handleReconnect = React.useCallback((): void => {
    if (autoReconnect) {
      if (state.isConnecting === false) {
        dispatch({ type: 'SET_CONNECTING', payload: { value: true } });
        connect();
      }
    }
  }, [autoReconnect, connect, dispatch, state.isConnecting]);

  const reconnectTimer = useIntervalCallback(
    reconnectCheckIntervalMs,
    handleReconnect,
  );

  return React.useMemo(
    () => ({
      connect,
      send,
      state,
    }),
    [connect, send, state],
  );
};

export default useWebSocket;
