import { useEffect, useMemo, useRef } from 'react';

import type { MutableRefObject } from 'react';
import type {
  UseWebSocketProperties,
  WebSocketInstanceType,
  Dispatch,
  OwnRefType,
  WebSocketHandlers,
  GenericMessageFromServer,
  UseHandlersWithReconnectProps,
} from './types';

import { useReconnectTimer, withReconnect } from './reconnection';
import { withConnectedHandlers, bindHandlersToWebSocketRef } from './events';

const voidFunction = ((): void => undefined) as any;

import { WebSocketError } from './errors';

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
    } catch (err: any) {
      throw new WebSocketError(
        '[useWebSocket] error serializing JSON data.',
        err,
      );
    }
  };

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
