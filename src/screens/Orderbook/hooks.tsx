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
  OrderbookWSMessageType,
  WebSocketOrderbookSnapshotMessage,
  WebSocketOrderbookUpdateMessage,
} from '../../hooks/useWebSocket';
import { useWebSocket } from '../../hooks/useWebSocket';
import { orderBookReducer, INITIAL_ORDERBOOK_STATE } from './reducers';

import { useDebounceCallback } from '@react-hook/debounce';

import * as NetInfo from '../../services/NetInfo';

import type {
  OrderbookReducerAction,
  OrderbookGenericScopeDataType,
  OrderbookOrdersSortedObject,
} from './types';

const WEBSOCKET_URI = 'wss://www.cryptofacilities.com/ws/v1';

// @todo: better abstraction ws-orderbook (onX events for abstraction)
interface UserOrderbookConnectionProperties {
  orderBookDispatch: React.Dispatch<OrderbookReducerAction>;
}

export const useOrderbookConnection = ({ orderBookDispatch }: UserOrderbookConnectionProperties) => {
  const { isConnected, isInternetReachable } = NetInfo.useNetInfo();

  const [connectionStatus, setConnectionStatus] = React.useState({
    color: 'white',
    connectedToInternet: false,
    websocket: {
      connected: false,
      connecting: false,
    },
  });

  React.useEffect(() => {
    if (isConnected) {
      if (isInternetReachable) {
        setConnectionStatus((st) => ({ ...st, color: 'green', connectedToInternet: true }));
        console.log('internet is now reachable');
      }
      else {
        setConnectionStatus((st) => ({ ...st, color: 'yellow', connectedToInternet: false }));
      }
    }
    else {
      setConnectionStatus((st) => ({ ...st, color: 'red', connectedToInternet: false }));
    }
  }, [isConnected, isInternetReachable]);

  //reduceByGroupNumber
  const onMessageReceived = React.useCallback((decoded) => {
    if (decoded?.event === 'info' || decoded?.event === 'subscribed') {
      console.log({ decoded });
    }
    else {
      if (!decoded?.event) {
        if (decoded?.feed === 'book_ui_1') {
          orderBookDispatch({
            type: 'ORDERBOOK_UPDATE',
            payload: { updates: decoded as WebSocketOrderbookUpdateMessage<any>[] },
          });
        }
        else if (decoded?.feed === 'book_ui_1_snapshot') {
          orderBookDispatch({
            type: 'ORDERBOOK_SNAPSHOT',
            payload: { updates: decoded as WebSocketOrderbookSnapshotMessage<any>[] },
          });
        }
        else {
          console.log('(2)', { decoded });
        }
      }
      else {
        console.log('(2)', { decoded });
      }
    }
  }, []);

  const onConnectionStatusChange = React.useCallback((status, client, { connect } = {}) => {
    console.log('onConnectionStatusChange:', status);
    if (status.connected === true) {
      client.send(
        JSON.stringify({
          event: 'subscribe',
          feed: 'book_ui_1',
          product_ids: ['PI_XBTUSD'],
        }),
      );
      setConnectionStatus((st) => ({
        ...st,
        websocket: { ...st.websocket, connected: true, connecting: false },
      }));
    }
    else if (status.connected === false) {
      setConnectionStatus((st) => ({
        ...st,
        websocket: { ...st.websocket, connected: false, connecting: false },
      }));

      setTimeout(() => {
        if (status.connectedToInternet === true) {
          console.log('should retry reconnect NOW');
          connect();
        }
        else {
          console.log('should retry reconnect after internet comes');
        }
      }, 5000);
    }

    setConnectionStatus((st) => ({
      ...st,
      websocket: { ...st.websocket, ...status },
    }));
  }, []);

  useWebSocket<OrderbookWSMessageType>({
    uri: WEBSOCKET_URI,
    onMessageReceived,
    onConnectionStatusChange,
  });

  return { connectionStatus };
};

export const useOrderbookReducer = () =>
  React.useReducer<typeof orderBookReducer>(orderBookReducer, INITIAL_ORDERBOOK_STATE);

type OnProcessCycle = () => void;

interface UseOrderbookProcessingProperties {
  onProcessCycle: OnProcessCycle;
  orderBook: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>;
}

export const useOrderbookProcessing = ({
  onProcessCycle,
  orderBook /* @todo */,
}: UseOrderbookProcessingProperties) => {
  const calculateGrouped = useDebounceCallback(onProcessCycle, 125);

  React.useEffect(() => {
    calculateGrouped();
  }, [orderBook, calculateGrouped]);

  React.useEffect(() => {
    calculateGrouped();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {};
};
