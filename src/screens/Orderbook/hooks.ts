import * as React from 'react';
import { InteractionManager } from 'react-native';

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
  OrderbookWSMessageType,
  UseOrderbookConnectionProperties,
  UseOrderbookProcessingProperties,
  OrderbookControllerHookReturn,
  OrderbookGenericScopeDataType,
  OrdersMap,
} from './types';
import type { WebSocketState, WebSocketNativeError } from '@hooks/useWebSocket';

import { orderAndLimit, applyFnToScope } from './utils';

export const useOrderbookController = ({
  subscribeToProductIds,
  initialGroupBy = 100,
  webSocketUri,
  rowsPerSection = 8,
}: {
  subscribeToProductIds: string[];
  initialGroupBy: number;
  webSocketUri: string;
  rowsPerSection: number;
}): OrderbookControllerHookReturn => {
  const lazyInitialState: OrderbookStateType = React.useMemo(
    () => ({
      ...INITIAL_ORDERBOOK_STATE,
      groupBy: initialGroupBy,
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

// batch all updates in a single one to prevent
// several subsequent state updates (+ renders)
// and keep the last value for each key to prevent
// useless processing
const preprocessUpdates = (
  updates: PendingGroupUpdateRecord[],
): OrderbookGenericScopeDataType<OrdersMap> =>
  updates.reduce(
    (acc, { updates }: PendingGroupUpdateRecord) => {
      return {
        ...acc,
        asks: new Map([...acc.asks, ...updates.asks]),
        bids: new Map([...acc.bids, ...updates.bids]),
      };
    },
    { asks: new Map(), bids: new Map() },
  );

const ALLOWED_FEEDS = ['book_ui_1', 'book_ui_1_snapshot'];
const DEFAULT_ERROR_HANDLER = (err: WebSocketNativeError | Error) => {
  console.log('---> ERROR:', err);
};

/*
 * @todo: restore NetInfo functionality and troubleshoot issue
 * const { isConnected, isInternetReachable } = NetInfo.useNetInfo();
 * const [connectionStatus, setConnectionStatus] =
 *   React.useState<ConnectionStatusState>(INITIAL_CONNECTION_STATUS_STATE);
 */
export const useOrderbookConnection = ({
  orderBookDispatch,
  subscribeToProductIds,
  webSocketUri,
  reconnectCheckIntervalMs = 5000,
  autoReconnect = true,
  onError = DEFAULT_ERROR_HANDLER,
}: UseOrderbookConnectionProperties): { wsState: WebSocketState } => {
  const { dispatchToQ, consumeQ } = useOrderbookMainStateRef();

  useOrderbookProcessing({
    onProcessCycle: React.useCallback(() => {
      for (const updates of consumeQ(null)) {
        if (!updates || updates.length === 0) {
          break;
        }

        orderBookDispatch({
          type: 'UPDATE_GROUPED',
          payload: { updates: [preprocessUpdates(updates)] },
        });
      }
    }, [consumeQ, orderBookDispatch]),
  });

  const onMessage = React.useCallback(
    (decoded: OrderbookWSMessageType) => {
      if (decoded?.event === 'info' || decoded?.event === 'subscribed') {
        console.log('Orderbook: Websocket info: ', decoded);
        return;
      }

      if (decoded?.event) {
        console.warn('Orderbook: Unknown message received from WebSocket: ', {
          decoded,
        });
        return;
      }

      if (!decoded?.feed || ALLOWED_FEEDS.indexOf(decoded?.feed) == -1) {
        console.warn('Orderbook: Unknown message received from WebSocket: ', {
          decoded,
        });
        return;
      }

      const updates = applyFnToScope(decoded, (kv) => new Map(kv));

      switch (decoded.feed) {
        case 'book_ui_1':
          dispatchToQ([{ kind: 'u', updates }]);
          break;
        case 'book_ui_1_snapshot':
          dispatchToQ([{ kind: 's', updates }]);
          break;
      }
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onOpen = React.useCallback(
    ({ current: { send } }): void => {
      orderBookDispatch({ type: 'SET_LOADING', payload: { value: false } });
      send({
        event: 'subscribe',
        feed: 'book_ui_1',
        product_ids: subscribeToProductIds,
      });
    },
    [subscribeToProductIds, orderBookDispatch],
  );

  const onClose = React.useCallback((): void => {
    orderBookDispatch({ type: 'RESET_STATE' });
  }, [orderBookDispatch]);

  const {
    connect: wsConnect,
    close: wsDisconnect,
    state: wsState,
  } = useWebSocket<OrderbookWSMessageType>({
    uri: webSocketUri,
    onMessage,
    onOpen,
    onError,
    onClose,
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
    // eslint-disable-next-line no-restricted-globals
    const intval = setInterval(() => {
      if (isMounted()) {
        InteractionManager.runAfterInteractions(() => onProcessCycle());
      }
    }, intervalMs);
    return () => {
      // eslint-disable-next-line no-restricted-globals
      if (intval) clearInterval(intval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return;
};
