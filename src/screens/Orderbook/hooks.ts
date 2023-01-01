import * as React from 'react';

import { useWebSocket } from '../../hooks/useWebSocket';
import { orderBookReducer, INITIAL_ORDERBOOK_STATE } from './reducers';

import { useSafeEffect } from '@hooks/useSafeEffect';

import type {
  OrderbookDispatch,
  OrderbookStateType,
  OrderbookReducerInitialState,
  OrderbookReducer,
  OrderbookWSMessageType,
  UseOrderbookConnectionProperties,
  OrderbookControllerHookReturn,
  ExchangeModule,
} from './types';
import type { WebSocketState, WebSocketNativeError } from '@hooks/useWebSocket';

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
      rowsPerSection,
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

  return {
    asksData: orderBook.viewport.asks,
    bidsData: orderBook.viewport.bids,
    groupBy: orderBook.groupBy,
    minGroupBy: orderBook.minGroupBy,
    isLoading: orderBook.isLoading,
    orderBookDispatch,
    wsState,
  };
};

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
  const onMessage = React.useCallback(
    exchangeModule.onMessage(orderBookDispatch),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onOpen = React.useCallback(
    exchangeModule.onOpen(
      orderBookDispatch,
      exchangeModule.defaultOptions.defaultProduct,
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
        exchangeModule.fakeRemote(orderBookDispatch);
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
