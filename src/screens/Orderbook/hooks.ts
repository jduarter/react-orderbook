import * as React from 'react';

import type {
  OrderbookWSMessageType,
  WebSocketOrderbookSnapshotMessage,
  WebSocketOrderbookUpdateMessage,
  WebSocketOrderbookDataArray,
} from '../../hooks/useWebSocket';

import { useWebSocket } from '../../hooks/useWebSocket';
import { orderBookReducer, INITIAL_ORDERBOOK_STATE } from './reducers';

import * as NetInfo from '../../services/NetInfo';

import type {
  OrderbookDispatch,
  OrderbookStateType,
  OrderbookReducerInitialState,
  OrderbookReducer,
  PendingGroupUpdateRecord,
} from './types';

import { orderAndLimit, immutableGetReversedArr } from './utils';

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

  const asksData = orderAndLimit(orderBook.grouped.asks, 8, 'desc');
  const bidsData = orderAndLimit(orderBook.grouped.bids, 8, 'asc');
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

type IsMountedFunctionType = () => boolean;
type UseSafeEffectDestructor = () => void;

type UseSafeEffectEffect = (
  m: IsMountedFunctionType,
) => void | UseSafeEffectDestructor;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const voidFn = (): void => {};

const useSafeEffect = (
  effect: UseSafeEffectEffect,
  deps?: React.DependencyList,
) => {
  const ref = React.useRef<{
    mounted: boolean;
    effectFn: null | UseSafeEffectEffect;
  }>({ mounted: false, effectFn: null });
  React.useEffect(() => {
    ref.current.mounted = true;
    return () => {
      ref.current.effectFn = voidFn;
      ref.current.mounted = false;
    };
  }, []);

  React.useEffect(() => {
    ref.current.effectFn = effect;
  }, [effect]);

  const getLastEffectVersion = React.useCallback(() => {
    return ref.current.effectFn || voidFn;
  }, []);

  const isMounted = React.useCallback(() => ref.current.mounted, []);

  React.useEffect(
    () =>
      ref.current.mounted === true
        ? getLastEffectVersion()(isMounted)
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...(deps || []), getLastEffectVersion, isMounted],
  );

  return React.useMemo<{ isMounted: IsMountedFunctionType }>(
    () => ({ isMounted }),
    [isMounted],
  );
};

type UseGenericTimerCallbackKind =
  // eslint-disable-next-line no-restricted-globals
  | [typeof setTimeout, typeof setInterval]
  // eslint-disable-next-line no-restricted-globals
  | [typeof clearTimeout, typeof clearInterval];

const useGenericTimerCallback = <T = NodeJS.Timeout>(
  [setF, clearF]: UseGenericTimerCallbackKind,
  ms: number,
  callback: (...args: any[]) => void,
) => {
  const ref = React.useRef<T | undefined>();

  const finish = React.useCallback(() => {
    console.log('[reconnectTimer] finish');
    if (!ref.current) {
      return;
    }

    clearF(ref.current);
    ref.current = undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runClosure = React.useCallback(() => {
    callback(finish);
    ref.current = undefined;
  }, [callback, finish]);

  const start = React.useCallback(() => {
    if (ref.current !== undefined) {
      console.warn(
        'useGenericTimerCallback: trying to start when there is already a timer',
      );
      return;
    }

    ref.current = setF(runClosure, ms);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, runClosure]);

  const isStarted = React.useCallback(() => ref.current !== undefined, []);

  React.useEffect(() => {
    return () => {
      finish();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return React.useMemo(
    () => ({ start, finish, isStarted }),
    [start, finish, isStarted],
  );
};

const useTimeoutCallback = (ms: number, callback: (...args: any[]) => void) =>
  useGenericTimerCallback<NodeJS.Timeout>(
    // eslint-disable-next-line no-restricted-globals
    [setTimeout, clearTimeout],
    ms,
    callback,
  );

const useIntervalCallback = (ms: number, callback: (...args: any[]) => void) =>
  // eslint-disable-next-line no-restricted-globals
  useGenericTimerCallback<number>([setInterval, clearInterval], ms, callback);

type MainStateRefType = {
  pendingUpdates: Array<{ updates: Array<PendingGroupUpdateRecord> }>;
};

const useOrderbookMainStateRef = () => {
  const ref = React.useRef<MainStateRefType>({ pendingUpdates: [] });
  const dispatchUpdate = React.useCallback(({ payload: { updates } }) => {
    // console.log('-> push to queue');
    ref.current.pendingUpdates.push({ updates });
  }, []);
  const getSingleUpdate = function* () {
    yield ref.current.pendingUpdates.shift();
  };
  return { dispatchUpdate, getSingleUpdate };
};

export const useOrderbookConnection = ({
  orderBookDispatch,
  subscribeToProductIds,
  webSocketUri,
}: UserOrderbookConnectionProperties): {
  connectionStatus: ConnectionStatusState;
} => {
  const { dispatchUpdate, getSingleUpdate } = useOrderbookMainStateRef();
  const { isConnected, isInternetReachable } = NetInfo.useNetInfo();

  const [connectionStatus, setConnectionStatus] =
    React.useState<ConnectionStatusState>({
      color: 'white',
      connectedToInternet: false,
      websocket: {
        connected: false,
        connecting: false,
      },
    });

  useOrderbookProcessing({
    onProcessCycle: React.useCallback(() => {
      for (const update of getSingleUpdate()) {
        if (!update) {
          continue;
        }

        orderBookDispatch({
          type: 'UPDATE_GROUPED',
          payload: { updates: [update] },
        });
      }
    }, [getSingleUpdate]),
  });

  const onMessageReceived = React.useCallback((decoded) => {
    if (decoded?.event === 'info' || decoded?.event === 'subscribed') {
      console.log('Orderbook: Websocket info: ', decoded);
    } else {
      if (!decoded?.event) {
        if (decoded?.feed === 'book_ui_1') {
          dispatchUpdate({
            type: 'ORDERBOOK_UPDATE',
            payload: {
              updates: decoded as WebSocketOrderbookUpdateMessage<any>[],
            },
          });
        } else if (decoded?.feed === 'book_ui_1_snapshot') {
          dispatchUpdate({
            type: 'ORDERBOOK_SNAPSHOT',
            payload: {
              updates: decoded as WebSocketOrderbookSnapshotMessage<any>[],
            },
          });
        } else {
          console.warn('Orderbook: Unknown message received from WebSocket: ', {
            decoded,
          });
        }
      } else {
        console.warn('Orderbook: Unknown message received from WebSocket: ', {
          decoded,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
