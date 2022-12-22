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
  ExchangeModule,
} from './types';
import type { WebSocketState, WebSocketNativeError } from '@hooks/useWebSocket';

import { orderAndLimit } from './utils';

export const useOrderbookController = ({
  exchangeModule,
  rowsPerSection = 8,
}: {
  exchangeModule: ExchangeModule;
  rowsPerSection: number;
}): OrderbookControllerHookReturn => {
  const lazyInitialState: OrderbookStateType = React.useMemo(
    () => ({
      ...INITIAL_ORDERBOOK_STATE,
      groupBy: exchangeModule.defaultOptions.groupBy,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [orderBook, orderBookDispatch] = useOrderbookReducer(
    lazyInitialState,
    exchangeModule.mainReducerOverrides,
  );
  const { wsState } = useOrderbookConnection({
    orderBookDispatch,
    exchangeModule,
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
  reconnectCheckIntervalMs = 5000,
  autoReconnect = true,
  onError = DEFAULT_ERROR_HANDLER,
  exchangeModule,
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
    exchangeModule.onMessage(dispatchToQ),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onOpen = React.useCallback(
    exchangeModule.onOpen(
      orderBookDispatch,
      exchangeModule.defaultOptions.subscribeToProductIds,
    ),
    [exchangeModule.defaultOptions.subscribeToProductIds, orderBookDispatch],
  );

  const onClose = React.useCallback((): void => {
    orderBookDispatch({ type: 'RESET_STATE' });
  }, [orderBookDispatch]);

  const {
    connect: wsConnect,
    close: wsDisconnect,
    state: wsState,
  } = useWebSocket<OrderbookWSMessageType>({
    uri: exchangeModule.defaultOptions.uri,
    onMessage,
    onOpen,
    onError,
    onClose,
    reconnectCheckIntervalMs,
    autoReconnect,
  });

  const mainEffect = React.useCallback(
    (isMounted: () => boolean) => {
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
  exchangeModuleOverrides: any, //@todo-type
): [OrderbookStateType, OrderbookDispatch] =>
  React.useReducer<OrderbookReducer>(
    orderBookReducer(exchangeModuleOverrides),
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
