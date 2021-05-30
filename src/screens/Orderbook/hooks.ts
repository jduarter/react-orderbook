import * as React from 'react';

import { useWebSocket } from '../../hooks/useWebSocket';
import { orderBookReducer, INITIAL_ORDERBOOK_STATE } from './reducers';

import { useSafeEffect } from '@hooks/useSafeEffect';
import { useGeneratorQueue } from '@hooks/useGeneratorQueue';

import type {
  OrderbookDispatch,
  OrderbookStateType,
  OrderbookReducerInitialState,
  OrderbookReducer,
  PendingGroupUpdateRecord,
  WSDataPriceSizePair,
  OrderbookWSMessageType,
  UseOrderbookConnectionProperties,
  UseOrderbookProcessingProperties,
} from './types';
import type { WebSocketState } from '@hooks/useWebSocket';

import { orderAndLimit } from './utils';

export const useOrderbookController = ({
  disableTwoWayProcessing = true,
  subscribeToProductIds,
  initialGroupBy = 100,
  webSocketUri,
  rowsPerSection = 8,
}: {
  disableTwoWayProcessing: boolean;
  subscribeToProductIds: string[];
  initialGroupBy: number;
  webSocketUri: string;
  rowsPerSection: number;
}): {
  orderBookDispatch: OrderbookDispatch;
  bidsData: WSDataPriceSizePair[];
  asksData: WSDataPriceSizePair[];
  isLoading: boolean;
  groupBy: number;
  rowsPerSection?: number;
  wsState: WebSocketState;
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
  const { wsState } = useOrderbookConnection({
    webSocketUri,
    orderBookDispatch,
    subscribeToProductIds,
  });

  const asksData = orderAndLimit(
    orderBook.grouped.asks,
    rowsPerSection,
    'desc',
  );
  const bidsData = orderAndLimit(orderBook.grouped.bids, rowsPerSection, 'asc');
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
      wsState,
    }),
    [
      asksData,
      orderBook.groupBy,
      orderBook.isLoading,
      bidsData,
      orderBookDispatch,
      wsState,
    ],
  );
};

const useOrderbookMainStateRef = (initial: PendingGroupUpdateRecord[] = []) =>
  useGeneratorQueue<PendingGroupUpdateRecord>(initial);

export const useOrderbookConnection = ({
  orderBookDispatch,
  subscribeToProductIds,
  webSocketUri,
  reconnectCheckIntervalMs = 5000,
  autoReconnect = true,
}: UseOrderbookConnectionProperties): { wsState: WebSocketState } => {
  const { dispatchToQ, consumeQ } = useOrderbookMainStateRef();
  // NetInfo isn't accurately dispatching events currently
  // after first iOS disconnect - it seems like there are more developers
  // experiencing the same issue.
  // I will disable it for the moment, delete unneeded code & focus
  // purely in the WS connection state.
  // const { isConnected, isInternetReachable } = NetInfo.useNetInfo();
  /*
  const [connectionStatus, setConnectionStatus] =
    React.useState<ConnectionStatusState>(INITIAL_CONNECTION_STATUS_STATE);
*/
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

  const onMessage = React.useCallback(
    (decoded: OrderbookWSMessageType) => {
      if (decoded?.event === 'info' || decoded?.event === 'subscribed') {
        console.log('Orderbook: Websocket info: ', decoded);
      } else {
        if (!decoded?.event) {
          if (decoded?.feed === 'book_ui_1') {
            dispatchToQ([{ kind: 'u', updates: decoded }]);
          } else if (decoded?.feed === 'book_ui_1_snapshot') {
            dispatchToQ([{ kind: 's', updates: decoded }]);
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
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onOpen = React.useCallback(
    ({ send }): void => {
      console.log('*** onConnect triggered correctly');

      orderBookDispatch({ type: 'SET_LOADING', payload: { value: false } });
      send({
        event: 'subscribe',
        feed: 'book_ui_1',
        product_ids: subscribeToProductIds,
      });
    },
    [subscribeToProductIds, orderBookDispatch],
  );

  const onError = React.useCallback((err) => {
    console.log('---> ERROR:', err);
  }, []);

  const {
    connect: wsConnect,
    close: wsDisconnect,
    state: wsState,
  } = useWebSocket<OrderbookWSMessageType>({
    uri: webSocketUri,
    onMessage,
    onOpen,
    onError,
    reconnectCheckIntervalMs,
    autoReconnect,
  });

  const mainEffect = React.useCallback(
    (isMounted) => {
      if (!isMounted()) {
        return;
      }

      console.log('[ws] opening connection from mainEffect');
      wsConnect();

      return () => {
        console.log('[ws] closing connection from mainEffect');
        if (wsDisconnect) wsDisconnect();
      };
    },
    [wsConnect, wsDisconnect],
  );

  useSafeEffect(mainEffect, []);

  return { wsState };
};

export const useOrderbookReducer = (
  initialState: OrderbookReducerInitialState = INITIAL_ORDERBOOK_STATE,
): [OrderbookStateType, OrderbookDispatch] =>
  React.useReducer<OrderbookReducer>(
    orderBookReducer,
    initialState as OrderbookStateType,
  );

export const useOrderbookProcessing = ({
  onProcessCycle,
  intervalMs = 50,
}: UseOrderbookProcessingProperties): void => {
  useSafeEffect((isMounted) => {
    console.log('useOrderbookProcessing safe effect called');
    // eslint-disable-next-line no-restricted-globals
    const intval = setInterval(
      () => isMounted() && onProcessCycle(),
      intervalMs,
    );
    return () => {
      // eslint-disable-next-line no-restricted-globals
      if (intval) clearInterval(intval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return;
};
