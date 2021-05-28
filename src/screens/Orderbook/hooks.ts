import * as React from 'react';

import type {
  OrderbookWSMessageType,
  WebSocketOrderbookSnapshotMessage,
  WebSocketOrderbookUpdateMessage,
  WebSocketOrderbookDataArray,
} from '../../hooks/useWebSocket';

import { useWebSocket } from '../../hooks/useWebSocket';
import { orderBookReducer, INITIAL_ORDERBOOK_STATE } from './reducers';

import { useSafeEffect } from '@hooks/useSafeEffect';
import { useIntervalCallback } from '@hooks/useTimerCallbacks';
import { useGeneratorQueue } from '@hooks/useGeneratorQueue';

import * as NetInfo from '../../services/NetInfo';

import type {
  OrderbookDispatch,
  OrderbookStateType,
  OrderbookReducerInitialState,
  OrderbookReducer,
  PendingGroupUpdateRecord,
} from './types';

import { orderAndLimit } from './utils';

interface ConnectionStatusState {
  color: string;
  connectedToInternet: boolean;
  websocket: {
    connected: boolean;
    connecting: boolean;
  };
}

// @todo: better abstraction ws-orderbook (onX events for abstraction)
interface UserOrderbookConnectionProperties {
  orderBookDispatch: OrderbookDispatch;
  webSocketUri: string;
  subscribeToProductIds: string[];
}

export const useOrderbookController = ({
  disableTwoWayProcessing = true,
  subscribeToProductIds,
  initialGroupBy = 100,
  webSocketUri,
}: {
  disableTwoWayProcessing: boolean;
  subscribeToProductIds: string[];
  initialGroupBy: number;
  webSocketUri: string;
}): {
  orderBookDispatch: OrderbookDispatch;
  bidsData: WebSocketOrderbookDataArray;
  asksData: WebSocketOrderbookDataArray;
  connectionStatus: ConnectionStatusState;
  isLoading: boolean;
  groupBy: number;
} => {
  const lazyInitialState: OrderbookStateType = React.useMemo(
    () => ({
      ...INITIAL_ORDERBOOK_STATE,
      groupBy: initialGroupBy,
      options: {
        ...INITIAL_ORDERBOOK_STATE.options,
        disableTwoWayProcessing,
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [orderBook, orderBookDispatch] = useOrderbookReducer(lazyInitialState);
  const { connectionStatus } = useOrderbookConnection({
    webSocketUri,
    orderBookDispatch,
    subscribeToProductIds,
  });

  const asksData = orderAndLimit(orderBook.grouped.asks, 12, 'desc');
  const bidsData = orderAndLimit(orderBook.grouped.bids, 12, 'asc');
  /*
  console.log(
    'ASKS (' + Object.keys(orderBook.grouped.asks).length + '): ',
    Object.keys(orderBook.grouped.asks),
  );
  console.log(
    'BIDS (' + Object.keys(orderBook.grouped.bids).length + '): ',
    Object.keys(orderBook.grouped.bids),
  );*/

  return React.useMemo(
    () => ({
      asksData,
      bidsData,
      groupBy: orderBook.groupBy,
      isLoading: orderBook.isLoading,
      orderBookDispatch,
      connectionStatus,
    }),
    [
      connectionStatus,
      asksData,
      orderBook.groupBy,
      orderBook.isLoading,
      bidsData,
    ],
  );
};

const useOrderbookMainStateRef = (initial: PendingGroupUpdateRecord[] = []) =>
  useGeneratorQueue<PendingGroupUpdateRecord>(initial);

const INITIAL_CONNECTION_STATUS_STATE = () => ({
  color: 'white',
  connectedToInternet: false,
  websocket: {
    connected: false,
    connecting: false,
  },
});

export const useOrderbookConnection = ({
  orderBookDispatch,
  subscribeToProductIds,
  webSocketUri,
}: UserOrderbookConnectionProperties): {
  connectionStatus: ConnectionStatusState;
} => {
  const { dispatchFromQ, consumeQ } = useOrderbookMainStateRef();
  const { isConnected, isInternetReachable } = NetInfo.useNetInfo();

  const [connectionStatus, setConnectionStatus] =
    React.useState<ConnectionStatusState>(INITIAL_CONNECTION_STATUS_STATE);

  useOrderbookProcessing({
    onProcessCycle: React.useCallback(() => {
      for (const update of consumeQ()) {
        if (!update) {
          continue;
        }

        orderBookDispatch({
          type: 'UPDATE_GROUPED',
          payload: { updates: [update] },
        });
      }
    }, []),
  });

  const onMessageReceived = React.useCallback(
    (decoded: WebSocketOrderbookUpdateMessage<any>) => {
      if (decoded?.event === 'info' || decoded?.event === 'subscribed') {
        console.log('Orderbook: Websocket info: ', decoded);
      } else {
        if (!decoded?.event) {
          if (decoded?.feed === 'book_ui_1') {
            dispatchFromQ([{ kind: 'u', updates: decoded }]);
          } else if (decoded?.feed === 'book_ui_1_snapshot') {
            dispatchFromQ([{ kind: 's', updates: decoded }]);
          } else {
            console.warn(
              'Orderbook: Unknown message received from WebSocket: ',
              {
                decoded,
              },
            );
          }
        } else {
          console.warn('Orderbook: Unknown message received from WebSocket: ', {
            decoded,
          });
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [],
  );

  const reconnectTimer = useIntervalCallback(
    5000,
    React.useCallback((): void => {
      if (connectionStatus.websocket.connecting === false) {
        orderBookDispatch({ type: 'SET_LOADING', payload: { value: true } });
        connect();
      }
    }, [connectionStatus.websocket, connect]),
  );

  const onConnectionStatusChange = React.useCallback(
    (status): void => {
      console.log('onConnectionStatusChange:', status);

      if (
        status.connected === true &&
        connectionStatus.websocket.connected === true
      ) {
        setConnectionStatus((st) => ({
          ...st,
          websocket: {
            ...st.websocket,
            connected: true,
            connecting: false,
          },
        }));
        return;
      } else if (status.connected === false && status.connecting !== true) {
        setConnectionStatus((st) => ({
          ...st,
          websocket: {
            ...st.websocket,
            connected: false,
            connecting: false,
          },
        }));

        if (!reconnectTimer.isStarted()) {
          console.log('call reconnectTimer!');
          reconnectTimer.start();
        }
        return;
      }

      setConnectionStatus((st) => ({
        ...st,
        websocket: { ...st.websocket, ...status },
      }));
    },
    [connectionStatus.websocket.connected, reconnectTimer],
  );

  const onConnect = React.useCallback(
    ({ send }): void => {
      console.log('*** onConnect triggered correctly');

      if (reconnectTimer.isStarted()) {
        reconnectTimer.finish();
      }

      orderBookDispatch({ type: 'SET_LOADING', payload: { value: false } });
      send({
        event: 'subscribe',
        feed: 'book_ui_1',
        product_ids: subscribeToProductIds,
      });
    },
    [subscribeToProductIds, orderBookDispatch, reconnectTimer],
  );

  const { connect } = useWebSocket<OrderbookWSMessageType>({
    uri: webSocketUri,
    onMessageReceived,
    onConnectionStatusChange,
    onConnect,
  });

  const mainEffect = React.useCallback((isMounted) => {
    if (!isMounted()) {
      return;
    }

    console.log('[ws] opening connection from mainEffect');
    connect();

    return () => {};
  }, []);

  useSafeEffect(mainEffect, []);

  React.useEffect(() => {
    if (isConnected) {
      if (isInternetReachable) {
        setConnectionStatus((st) => ({
          ...st,
          color: 'green',
          connectedToInternet: true,
        }));
        console.log('internet is now reachable');
      } else {
        setConnectionStatus((st) => ({
          ...st,
          color: 'yellow',
          connectedToInternet: false,
        }));
      }
    } else {
      setConnectionStatus((st) => ({
        ...st,
        color: 'red',
        connectedToInternet: false,
      }));
    }
  }, [isConnected, isInternetReachable]);

  return { connectionStatus };
};

export const useOrderbookReducer = (
  initialState: OrderbookReducerInitialState = INITIAL_ORDERBOOK_STATE,
): [OrderbookStateType, OrderbookDispatch] =>
  React.useReducer<OrderbookReducer>(orderBookReducer, initialState);

type OnProcessCycle = () => void;

interface UseOrderbookProcessingProperties {
  onProcessCycle: OnProcessCycle;
  ms?: number;
}

export const useOrderbookProcessing = ({
  onProcessCycle,
  ms = 50,
}: UseOrderbookProcessingProperties): void => {
  useSafeEffect((isMounted) => {
    console.log('useOrderbookProcessing safe effect called');
    // eslint-disable-next-line no-restricted-globals
    const intval = setInterval(() => isMounted() && onProcessCycle(), ms);
    return () => {
      // eslint-disable-next-line no-restricted-globals
      if (intval) clearInterval(intval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return;
};
