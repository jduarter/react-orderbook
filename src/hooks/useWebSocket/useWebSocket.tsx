import { useEffect, useMemo, useCallback, useRef } from 'react';

import { useIntervalCallback } from '@hooks/useTimerCallbacks';

import type { MutableRefObject } from 'react';
import type {
  UseWebSocketProperties,
  WebSocketInstanceType,
  GenericMessageFromServer,
  UseHandlersWithReconnectProps,
  Dispatch,
  OwnRefType,
  WebSocketHandlers,
} from './types';

const voidFunction = ((): void => undefined) as any;

import { WebSocketError } from './errors';
import { useHandlers } from './hooks';
import { useWebSocketReducer, INITIAL_STATE } from './reducers';

const useOnCloseConnection = (current: WebSocket | null): void =>
  useEffect(() => {
    return () => {
      console.log('[WS] closing connection');
      if (current) {
        if (current.close) {
          current.close();
        }
        current.onopen = null;
        current.onerror = null;
        current.onmessage = null;
        current.onclose = null;
      }
    };
  }, []);

const useConnectFn = (
  uri: string,
  dispatch: Dispatch,
  ref: MutableRefObject<WebSocketInstanceType>,
  handlers: Partial<WebSocketHandlers<any>>,
) =>
  useCallback(async (): Promise<boolean> => {
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

const useSendFn = (ref: MutableRefObject<WebSocketInstanceType>) =>
  useCallback(async (obj: any): Promise<boolean> => {
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

const useHandlersWithReconnect = ({
  autoReconnect,
  reconnectCheckIntervalMs,
  onClose,
  onOpen,
  isConnecting,
  current,
  send,
}: UseHandlersWithReconnectProps) => {
  const handleReconnect = useCallback((): void => {
    if (autoReconnect && isConnecting === false && current) {
      current.connect();
    }
  }, [autoReconnect, isConnecting]);

  const reconnectTimer = useIntervalCallback(
    reconnectCheckIntervalMs,
    handleReconnect,
  );

  const onLocalClose = useCallback(() => {
    if (autoReconnect && !reconnectTimer.isStarted()) {
      reconnectTimer.start();
    }

    onClose();
  }, [onClose, reconnectTimer, autoReconnect]);

  const onLocalOpen = useCallback(() => {
    if (autoReconnect && reconnectTimer.isStarted()) {
      reconnectTimer.finish();
    }
    onOpen({ send });
  }, [reconnectTimer, autoReconnect, onOpen]);

  return [onLocalOpen, onLocalClose];
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

  const send = useSendFn(ref);

  const [onLocalOpen, onLocalClose] = useHandlersWithReconnect({
    onOpen,
    onClose,
    autoReconnect,
    reconnectCheckIntervalMs,
    current: ownRef?.current,
    isConnecting: state.isConnecting,
    send,
  });

  const handlers = useHandlers(
    { send, dispatch },
    {
      onMessage,
      onOpen: onLocalOpen,
      onClose: onLocalClose,
      onError,
    },
  );

  const connect = useConnectFn(uri, dispatch, ref, handlers);

  useOnCloseConnection(ref.current);

  useEffect(() => {
    ownRef.current = { connect, send };
  }, [connect, send]);

  return useMemo(
    () => ({
      send: ownRef.current ? ownRef.current.send : send,
      connect: ownRef.current ? ownRef.current.connect : connect,
      state,
    }),
    [state, send, connect],
  );
};

export default useWebSocket;
