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

import type { ThrowableErrorConstructorArguments } from '@utils/getThrowableError';

const voidFunction = ((): void => undefined) as any;

const WebSocketError = getThrowableError(
  'WebSocketError',
  (userMessage: string, details?: { originalError?: Error }) => ({
    userMessage,
    originalError: details?.originalError || undefined,
  }),
);

const WebSocketJSONError = getThrowableError<
  'WebSocketJSONError',
  ThrowableErrorConstructorArguments & [string, { data: any }]
>(
  'WebSocketJSONError',
  (userMessage: string, details?: { originalError?: Error; data?: any }) => ({
    userMessage,
    originalError: details?.originalError || undefined,
    data: details?.data || undefined,
  }),
  WebSocketError,
);

const useHandlers: BindHandlersFunction = (
  { send, dispatch },
  { onMessage, onOpen, onClose, onError },
) => {
  const onOpenHandler = React.useCallback(() => {
    if (onOpen) {
      onOpen({ send });
    }

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
        let decoded;
        try {
          decoded = JSON.parse(data);
        } catch (err: any) {
          throw new WebSocketJSONError(
            'onMessageReceive: could not decode JSON-parsed data!',
            { originalError: err, data },
          );
        }
        onMessage(decoded);
      } catch (err: any) {
        console.log({
          err,
          e1: err instanceof WebSocketJSONError,
          e2: err instanceof WebSocketError,
          e3: err.constructor.name,
          e4: err.name,
        });
        if (err instanceof WebSocketJSONError) {
          throw err;
        } else {
          throw new WebSocketError(
            'onMessageReceive: unexpected error, probably due exception raised in onMessage() handler.',
            { originalError: err },
          );
        }
      }
    },
    [onMessage],
  );

  const onCloseHandler = React.useCallback(() => {
    dispatch({ type: 'SET_CONNECTED', payload: { value: false } });
    dispatch({ type: 'SET_CONNECTING', payload: { value: false } });

    if (onClose) {
      onClose();
    }
  }, [onClose, dispatch]);

  const onErrorHandler = React.useCallback(
    (error: WebSocketNativeError) => {
      console.log('*** client.onerror:', error);

      onCloseHandler();
      if (onError) {
        onError(error);
      }
      // {"isTrusted": false, "message": "The operation couldn’t be completed. Network is down"}
    },
    [onCloseHandler, onError],
  );

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

const INITIAL_STATE = () => ({
  isLoading: true,
  isConnected: false,
  isConnecting: false,
  shouldReconnectNow: false,
});

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useMemo(() => initialState(), []) as WebSocketState,
  );

const useWebSocket = <
  MFS extends GenericMessageFromServer = GenericMessageFromServer,
>(
  props: UseWebSocketProperties<MFS>,
): WebSocketInstanceType => {
  const ref = React.useRef<WebSocket | null>(null);
  const ownRef =
    React.useRef<{
      connect: () => Promise<boolean>;
      send: (obj: any) => Promise<boolean>;
    } | null>(null);

  const {
    uri,
    onMessage = voidFunction,
    onOpen = voidFunction,
    onClose = voidFunction,
    onError = voidFunction,
    autoReconnect = true,
    reconnectCheckIntervalMs = 5000,
  } = props;

  const [state, dispatch] = useWebSocketReducer(INITIAL_STATE);

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

  const handleReconnect = React.useCallback((): void => {
    if (autoReconnect && state.isConnecting === false && ownRef.current) {
      ownRef.current.connect();
    }
  }, [autoReconnect, state.isConnecting]);

  const reconnectTimer = useIntervalCallback(
    reconnectCheckIntervalMs,
    handleReconnect,
  );

  const onLocalClose = React.useCallback(() => {
    if (autoReconnect && !reconnectTimer.isStarted()) {
      reconnectTimer.start();
    }

    onClose();
  }, [onClose, reconnectTimer, autoReconnect]);

  const onLocalOpen = React.useCallback(() => {
    if (autoReconnect && reconnectTimer.isStarted()) {
      reconnectTimer.finish();
    }
    onOpen({ send });
  }, [reconnectTimer, autoReconnect, onOpen, send]);

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
    dispatch({ type: 'SET_CONNECTED', payload: { value: true } });

    ref.current = new WebSocket(uri) as WebSocketInstanceType;

    if (ref.current) {
      ref.current.onopen = (handlers.onOpen as () => void) || null;
      ref.current.onmessage = handlers.onMessage || null;
      ref.current.onclose = handlers.onClose || null;
      ref.current.onerror = handlers.onError || null;

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
        if (ref.current.close) {
          ref.current.close();
        }
        ref.current.onopen = null;
        ref.current.onerror = null;
        ref.current.onmessage = null;
        ref.current.onclose = null;
      }
    };
  }, []);

  React.useEffect(() => {
    ownRef.current = { connect, send };
  }, [connect, send]);

  return React.useMemo(
    () => ({
      send: ownRef.current ? ownRef.current?.send : send,
      connect: ownRef.current ? ownRef.current?.connect : connect,
      state,
    }),
    [state, send, connect],
  );
};

export default useWebSocket;
