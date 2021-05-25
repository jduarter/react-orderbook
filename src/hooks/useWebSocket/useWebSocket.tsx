/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                               *
 *                    | react-native-orderbook |                 *
 *                                                               *
 *  License |  MIT General Public License                        *
 *  Author  |  Jorge Duarte Rodríguez <info@malagadev.com>       *
 *                                                               *
 *                            (c) 2021                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
import * as React from 'react';

import type {
  GenericMessageType,
  UseWebSocketProps as UseWebSocketProperties,
  BindHandlersFunction,
  WebSocketHandlers,
  WebSocketState,
  OtherExtraEventCallbacks,
  WebSocketInstanceType,
} from './types';

const voidFunction = ((...anyArgument: any): void => undefined) as any;

const bindHandlersToClient: BindHandlersFunction = (
  client,
  { onConnectionStatusChange, onMessageReceived },
): void => {
  client.addEventListener('open', () => {
    if (onConnectionStatusChange) onConnectionStatusChange({ connected: true }, client);
  });

  client.onmessage = ({ data }: { data?: string }) =>
    data != undefined && onMessageReceived && onMessageReceived(JSON.parse(data));

  client.onclose = () => {
    if (onConnectionStatusChange) {
      onConnectionStatusChange({ connected: false, connecting: false }, client);
    }
  };

  client.addEventListener('error', (error?: any) => {
    console.log('client.onerror:', error);
    // {"isTrusted": false, "message": "The operation couldn’t be completed. Network is down"}

    if (onConnectionStatusChange) {
      onConnectionStatusChange({ connected: false, connecting: false }, client);
    }
  });
};

const groupHandlersInObject = <
  MT extends GenericMessageType = GenericMessageType,
  S extends WebSocketState = WebSocketState,
>(
    o: Record<string, any>,
    fallback: typeof voidFunction = voidFunction,
  ): WebSocketHandlers<MT, S> & OtherExtraEventCallbacks =>
  Object.entries(o).reduce(
    (accumulator, [ok, ov]) => ({ ...accumulator, [ok]: ov || fallback }),
    {},
  ) as WebSocketHandlers<MT, S> & OtherExtraEventCallbacks;

const useWebSocket = <MT extends GenericMessageType = GenericMessageType>(
  properties: UseWebSocketProperties<MT>,
): WebSocketInstanceType => {
  const { uri, onMessageReceived = voidFunction, onConnectionStatusChange = voidFunction } = properties;

  const reference = React.useRef<null | WebSocket>(null);

  const connect = React.useCallback(async (): Promise<boolean> => {
    onConnectionStatusChange({ connected: false, connecting: true }, null);

    const client = new WebSocket(uri);

    bindHandlersToClient(
      client,
      groupHandlersInObject({ onConnectionStatusChange, onMessageReceived }),
    );

    reference.current = client;

    return true;
  }, [onConnectionStatusChange, onMessageReceived, uri]);

  React.useEffect(() => {
    console.log('[ws] opening connection');
    connect();
    return () => {
      console.log('closing connection');
      reference.current && reference.current.close();
    };
  }, [uri, connect]);

  return { connect };
};

export default useWebSocket;
