import { useEffect, useMemo, useCallback, useRef } from 'react';

import { useIntervalCallback } from '@hooks/useTimerCallbacks';
import type { TimerHandler } from '@hooks/useTimerCallbacks';

import type { MutableRefObject } from 'react';
import type {
  UseWebSocketProperties,
  WebSocketInstanceType,
  UseHandlersWithReconnectProps,
  Dispatch,
  OwnRefType,
  WebSocketHandlers,
  ReconnectHOCReturnType,
  WebSocketNativeError,
  OnMessageReceivedFunction,
  GenericMessageFromServer,
  OnCloseFnType,
} from './types';

const voidFunction = ((): void => undefined) as any;

import { WebSocketError, WebSocketJSONError } from './errors';

import { useWebSocketReducer, INITIAL_STATE } from './reducers';

const onConnectionClosed = (
  ref: React.MutableRefObject<WebSocket | null>,
): void => {
  if (ref.current) {
    if (ref.current.close) {
      ref.current.close();
    }
    ref.current.onopen = null;
    ref.current.onerror = null;
    ref.current.onmessage = null;
    ref.current.onclose = null;
    ref.current = null;
  }
};

const bindHandlersToWebSocketRef = (
  ref: MutableRefObject<WebSocketInstanceType>,
  handlers: Partial<WebSocketHandlers<any>>,
): void => {
  ref.current.onopen = handlers.onOpen || null;
  ref.current.onmessage = handlers.onMessage || null;
  ref.current.onclose = handlers.onClose || null;
  ref.current.onerror = handlers.onError || null;
};

const getConnectFn =
  (
    uri: string,
    dispatch: Dispatch,
    ref: MutableRefObject<WebSocketInstanceType>,
    handlers: Partial<WebSocketHandlers<any>>,
  ) =>
  async (): Promise<boolean> => {
    console.log('[WS] connecting to: ', uri);

    dispatch({ type: 'SET_CONNECTED', payload: { value: true } });

    ref.current = new WebSocket(uri) as WebSocketInstanceType;

    if (ref.current) {
      bindHandlersToWebSocketRef(ref, handlers);
      return true;
    } else {
      throw new WebSocketError('Unexpected connect error.');
    }
  };

const getSendFn =
  (ref: MutableRefObject<WebSocketInstanceType>) =>
  async (obj: any): Promise<boolean> => {
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
  };

const withReconnect = ({
  reconnectTimer,
  onClose,
  onOpen,
}: UseHandlersWithReconnectProps): ReconnectHOCReturnType => {
  const onLocalClose = () => {
    if (!reconnectTimer.isStarted()) {
      reconnectTimer.start();
    }

    onClose();
  };

  const onLocalOpen = (aRef: MutableRefObject<null | OwnRefType>) => {
    if (reconnectTimer.isStarted()) {
      reconnectTimer.finish();
    }
    onOpen(aRef);
  };

  return { onClose: onLocalClose, onOpen: onLocalOpen };
};

const useReconnectTimer = (
  autoReconnect: boolean,
  isConnecting: boolean,
  reconnectCheckIntervalMs: number,
  ref: MutableRefObject<OwnRefType | null>,
): TimerHandler =>
  useIntervalCallback(
    reconnectCheckIntervalMs,
    useCallback(() => {
      if (autoReconnect && isConnecting === false && ref?.current?.connect) {
        ref.current.connect();
      }
    }, [isConnecting]),
  );

const generateOnMessageHandler =
  <MFS extends GenericMessageFromServer = GenericMessageFromServer>(
    onMessage: OnMessageReceivedFunction<MFS>,
  ) =>
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
      if (err instanceof WebSocketJSONError) {
        throw err;
      } else {
        throw new WebSocketError(
          'onMessageReceive: unexpected error, probably due exception raised in onMessage() handler.',
          { originalError: err },
        );
      }
    }
  };

const getConnectedHandler = ({
  handlerName,
  originalHandler,
  ownRef,
}: {
  handlerName: string;
  originalHandler: WebSocketHandlers<any>[keyof WebSocketHandlers<any>];
  ownRef: MutableRefObject<null | OwnRefType>;
}) => {
  const onOpen = (/*originalWsEvent: { isTrusted?: boolean }*/): void => {
    originalHandler && originalHandler(ownRef);
    ownRef?.current?.dispatch({
      type: 'SET_CONNECTED',
      payload: { value: true },
    });
  };

  const onClose = () => {
    ownRef?.current?.dispatch({
      type: 'SET_CONNECTED',
      payload: { value: false },
    });
    ownRef?.current?.dispatch({
      type: 'SET_CONNECTING',
      payload: { value: false },
    });

    if (originalHandler) {
      (originalHandler as OnCloseFnType)();
    }
  };

  const onError = (error: WebSocketNativeError) => {
    onClose();
    if (originalHandler) {
      originalHandler(error);
    }
    // {"isTrusted": false, "message": "The operation couldn’t be completed. Network is down"}
  };

  const connectedHandlers: WebSocketHandlers<any> = {
    onOpen,
    onClose,
    onError,
    onMessage: generateOnMessageHandler(
      originalHandler as OnMessageReceivedFunction<any>,
    ),
  };

  return {
    [handlerName]:
      connectedHandlers[handlerName as keyof typeof connectedHandlers],
  };
};

const withConnectedHandlers = <
  I extends OwnRefType['handlers'] = OwnRefType['handlers'],
>(
  input: Partial<Record<keyof I, any>>,
  ownRef: MutableRefObject<null | OwnRefType>,
): I =>
  Object.keys(input).reduce((acc, handlerName) => {
    return {
      ...acc,
      ...getConnectedHandler({
        handlerName,
        originalHandler: input[handlerName as keyof I],
        ownRef,
      }),
    };
  }, {} as I);

const useWebSocket = <
  MFS extends GenericMessageFromServer = GenericMessageFromServer,
>(
  props: UseWebSocketProperties<MFS>,
): WebSocketInstanceType => {
  const ref = useRef<WebSocket | null>(null);
  const ownRef = useRef<OwnRefType | null>(null);

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

  const reconnectTimer = useReconnectTimer(
    autoReconnect,
    state.isConnecting,
    reconnectCheckIntervalMs,
    ownRef,
  );

  useEffect(() => {
    const connectionStateHandlers = withConnectedHandlers(
      {
        onOpen,
        onClose,
      },
      ownRef,
    );

    const handlers = {
      ...(autoReconnect
        ? withReconnect({
            ...connectionStateHandlers,
            reconnectTimer,
          } as UseHandlersWithReconnectProps)
        : connectionStateHandlers),
      ...withConnectedHandlers({ onMessage, onError }, ownRef),
    };

    /* initialize ref with connect/send methods */
    const connect = getConnectFn(uri, dispatch, ref, handlers);
    const send = getSendFn(ref);

    ownRef.current = {
      dispatch,
      connect,
      send,
      handlers,
    };

    return () => {
      /* cleanup */
      onConnectionClosed(ref);
    };
  }, []);

  return useMemo(
    () => ({
      send: (obj: any) => ownRef.current?.send && ownRef.current.send(obj),
      connect: () => ownRef.current?.connect && ownRef.current.connect(),
      state,
    }),
    [state],
  );
};

export default useWebSocket;
