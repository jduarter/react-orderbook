import * as React from 'react';
import { InteractionManager } from 'react-native';

import { Decimal } from 'decimal.js';

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
  ExchangeModule,
  OrdersMap,
} from './types';
import type { WebSocketState, WebSocketNativeError } from '@hooks/useWebSocket';

type NormalizedRecord = [number, number];
type NormalizedData = NormalizedRecord[];

// @todo - move this logic to reducer to prevent UI thread locking
const getTotalForRow = (
  rows: NormalizedData,
  index: number,
  orderBy: 'asc' | 'desc',
): Decimal =>
  rows.reduce(
    (acc: Decimal, current, ridx: number) =>
      acc.add(
        (orderBy === 'asc' ? ridx >= index : index >= ridx) ? current[1] : 0,
      ),
    new Decimal(0),
  );

const immutableGetReversedArr = <
  T extends [unknown, unknown] = [number, Decimal],
>(
  array: T[],
): T[] => {
  const copy = [...array];
  copy.reverse();
  return copy;
};

const splice = (str: string, offset: number, text: string): string => {
  let calculatedOffset = offset < 0 ? str.length + offset : offset;
  return (
    str.substring(0, calculatedOffset) + text + str.substring(calculatedOffset)
  );
};

const decimalFormat = (optimalInt: number, decimals: number = 2) => {
  return splice(optimalInt.toString(), -decimals, '.');
};

const orderAndLimit = (
  map: OrdersMap,
  limit = 10,
  orderBy: 'asc' | 'desc' = 'asc',
): [string, number, Decimal][] => {
  const array = [...map].sort((a, b) => a[0] - b[0]);

  const sorted =
    orderBy === 'desc' ? array.slice(0, limit) : array.slice(-limit);

  const result = immutableGetReversedArr<[number, number]>(sorted);

  return result.map((elem, index) => {
    const total = getTotalForRow(
      result,
      index,
      orderBy === 'asc' ? 'desc' : 'asc',
    );
    return [decimalFormat(elem[0], 2), elem[1], total];
  });
};

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
      minGroupBy:
        exchangeModule.defaultOptions.defaultProduct.groupByFactors[0],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [orderBook, orderBookDispatch] = useOrderbookReducer(
    lazyInitialState,
    exchangeModule,
  );

  const { wsState } = useOrderbookConnection({
    orderBookDispatch,
    exchangeModule,
  });

  // move this inside the reducer logic

  const asksData = orderAndLimit(
    orderBook.grouped.asks,
    rowsPerSection,
    'desc',
  );

  const bidsData = orderAndLimit(orderBook.grouped.bids, rowsPerSection, 'asc');

  return {
    asksData,
    bidsData,
    groupBy: orderBook.groupBy,
    minGroupBy: orderBook.minGroupBy,
    isLoading: orderBook.isLoading,
    orderBookDispatch,
    wsState,
  };
};

const useOrderbookMainStateRef = (initial: PendingGroupUpdateRecord[] = []) =>
  useGeneratorQueue<PendingGroupUpdateRecord>(initial);

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
        console.log('onProcessCycle: ', { updates });

        orderBookDispatch({
          type: 'UPDATE_GROUPED',
          payload: { updates },
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
      exchangeModule.defaultOptions.defaultProduct,
      dispatchToQ,
    ),
    [exchangeModule.defaultOptions.defaultProduct, orderBookDispatch],
  );

  const onClose = React.useCallback((): void => {
    orderBookDispatch({ type: 'RESET_STATE' });
  }, [orderBookDispatch]);

  const {
    connect: wsConnect,
    close: wsDisconnect,
    state: wsState,
  } = !exchangeModule.fakeRemote &&
  useWebSocket<OrderbookWSMessageType>({
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
      if (exchangeModule.fakeRemote) {
        exchangeModule.fakeRemote(orderBookDispatch, dispatchToQ);
      } else {
        wsConnect();
      }

      return () => {
        console.log('[ws] closing connection from mainEffect');
        if (wsDisconnect) wsDisconnect();
      };
    },
    [wsConnect, wsDisconnect, exchangeModule.fakeRemote],
  );

  useSafeEffect(mainEffect, []);

  return exchangeModule.fakeRemote
    ? { wsState: { isConnected: true } }
    : { wsState };
};

export const useOrderbookReducer = (
  initialState: OrderbookReducerInitialState = INITIAL_ORDERBOOK_STATE,
  exchangeModule: ExchangeModule,
): [OrderbookStateType, OrderbookDispatch] =>
  React.useReducer<OrderbookReducer>(
    React.useMemo(() => orderBookReducer(exchangeModule), [exchangeModule]),
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
