import * as React from 'react';

import type {
  GenericMessageType,
  UseWebSocketProps,
  BindHandlersFunction,
  WebSocketHandlers,
  WebSocketState,
  OtherExtraEventCallbacks,
  WebSocketInstanceType,
} from './types';

const voidFn = ((...anyArg: any): void => undefined) as any;

const bindHandlersToClient: BindHandlersFunction = (
  client,
  { onConnectionStatusChange, onMessageReceived },
): void => {
  client.onopen = () => {
    if (onConnectionStatusChange) onConnectionStatusChange({ connected: true }, client);
  };

  client.onmessage = ({ data }: { data?: string }) =>
    data != null && onMessageReceived && onMessageReceived(JSON.parse(data));

  client.onclose = () => {
    if (onConnectionStatusChange) {
      onConnectionStatusChange({ connected: false, connecting: false }, client);
    }
  };

  client.onerror = (err?: any) => {
    console.log('client.onerror:', err);
    // {"isTrusted": false, "message": "The operation couldn’t be completed. Network is down"}

    if (onConnectionStatusChange) {
      onConnectionStatusChange({ connected: false, connecting: false }, client);
    }
  };
};

const groupHandlersInObj = <
  MT extends GenericMessageType = GenericMessageType,
  S extends WebSocketState = WebSocketState,
>(
  o: Record<string, any>,
  fallback: typeof voidFn = voidFn,
): WebSocketHandlers<MT, S> & OtherExtraEventCallbacks =>
  Object.entries(o).reduce(
    (acc, [ok, ov]) => ({ ...acc, [ok]: ov || fallback }),
    {},
  ) as WebSocketHandlers<MT, S> & OtherExtraEventCallbacks;

const useWebSocket = <MT extends GenericMessageType = GenericMessageType>(
  props: UseWebSocketProps<MT>,
): WebSocketInstanceType => {
  const { uri, onMessageReceived = voidFn, onConnectionStatusChange = voidFn } = props;

  const ref = React.useRef<null | WebSocket>(null);

  const connect = React.useCallback(async (): Promise<boolean> => {
    onConnectionStatusChange({ connected: false, connecting: true }, null);

    const client = new WebSocket(uri);

    bindHandlersToClient(
      client,
      groupHandlersInObj({ onConnectionStatusChange, onMessageReceived }),
    );

    ref.current = client;

    return true;
  }, [onConnectionStatusChange, onMessageReceived, uri]);

  React.useEffect(() => {
    console.log('[ws] opening connection');
    connect();
    return () => {
      console.log('closing connection');
      ref.current && ref.current.close();
    };
  }, [uri, connect]);

  return { connect };
};

export default useWebSocket;
