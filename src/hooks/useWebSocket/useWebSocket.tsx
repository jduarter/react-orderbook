import * as React from 'react';

import type {
  GenericMessageType,
  UseWebSocketProperties,
  BindHandlersFunction,
  WebSocketHandlers,
  WebSocketState,
  OtherExtraEventCallbacks,
  WebSocketInstanceType,
} from './types';

const voidFunction = ((): void => undefined) as any;

export class WebSocketError extends Error {}

const bindHandlersToClient: BindHandlersFunction = (
  { client, send },
  { onConnectionStatusChange, onMessageReceived, onConnect },
): void => {
  client.onopen = () => {
    console.log('-------> client.onopen');
    if (onConnect) {
      onConnect({ client, send });
    }

    if (onConnectionStatusChange) {
      onConnectionStatusChange({ connected: true });
    }
  };

  client.onmessage = ({ data }: { data?: string }) =>
    data && onMessageReceived && onMessageReceived(JSON.parse(data));

  client.onclose = () => {
    console.log('*** client.onClose');
    if (onConnectionStatusChange) {
      onConnectionStatusChange({ connected: false, connecting: false }, client);
    }
  };

  client.onerror = (error?: any) => {
    console.log('*** client.onerror:', error);
    // {"isTrusted": false, "message": "The operation couldn’t be completed. Network is down"}

    if (onConnectionStatusChange) {
      onConnectionStatusChange({ connected: false, connecting: false }, client);
    }
  };
};

const groupHandlersInObject = <
  MT extends GenericMessageType = GenericMessageType,
  S extends WebSocketState = WebSocketState,
>(
  o: Record<string, any>,
  fallback: typeof voidFunction = voidFunction,
): WebSocketHandlers<MT, S> & OtherExtraEventCallbacks =>
  Object.entries(o).reduce(
    (acc, [ok, ov]) => ({ ...acc, [ok]: ov || fallback }),
    {},
  ) as WebSocketHandlers<MT, S> & OtherExtraEventCallbacks;

const useWebSocket = <MT extends GenericMessageType = GenericMessageType>(
  properties: UseWebSocketProperties<MT>,
): WebSocketInstanceType => {
  console.log('useWebSocket called: ', properties);
  const {
    uri,
    onMessageReceived = voidFunction,
    onConnectionStatusChange = voidFunction,
    onConnect = voidFunction,
  } = properties;

  const reference = React.useRef<WebSocket>();

  const send = React.useCallback((obj: any) => {
    if (!reference.current) {
      throw new WebSocketError('[useWebSocket] client is not connected');
    }

    return reference.current.send(JSON.stringify(obj));
  }, []);

  const connect = React.useCallback(async (): Promise<boolean> => {
    console.log('CONNECT!!!!!! -> ', uri);
    onConnectionStatusChange({ connected: false, connecting: true });

    reference.current = new WebSocket(uri) as WebSocketInstanceType;

    bindHandlersToClient(
      { client: reference.current, send },
      groupHandlersInObject({
        onConnectionStatusChange,
        onMessageReceived,
        onConnect,
      }),
    );

    return true;
  }, [onConnectionStatusChange, onMessageReceived, onConnect, uri, send]);

  React.useEffect(() => {
    return () => {
      console.log('[WS] closing connection');
      if (reference.current) {
        reference.current.close();
        reference.current.onopen = null;
        reference.current.onerror = null;
        reference.current.onmessage = null;
        reference.current.onclose = null;
        reference.current = undefined;
      }
    };
  }, []);

  return React.useMemo(
    () => ({
      connect,
      send,
    }),
    [connect, send],
  );
};

export default useWebSocket;
