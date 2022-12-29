import type {
  GenericMessageFromServer,
  WebSocketState,
  WebSocketNativeError,
} from '../../hooks/useWebSocket';

import type { MutableRefObject } from 'react';

import type { Decimal } from 'decimal.js';

import type { OwnRefType } from '../../hooks/useWebSocket/types';
import type { UseGeneratorQueueDispatch } from '../../hooks/useGeneratorQueue/types';

export type OrderbookGroupedPrice = number;
export type OrderbookOrderSize = number;

export interface OrderbookGenericScopeDataType<T> {
  bids: T;
  asks: T;
}

type OrderbookBidsType = OrdersMap;
type OrderbookAsksType = OrdersMap;

export interface UseOrderbookConnectionProperties {
  orderBookDispatch: OrderbookDispatch;
  reconnectCheckIntervalMs?: number;
  autoReconnect?: boolean;
  onError?: (err: WebSocketNativeError | Error) => void;
  exchangeModule: ExchangeModule;
}

type OnProcessCycle = () => void;

export interface UseOrderbookProcessingProperties {
  onProcessCycle: OnProcessCycle;
  intervalMs?: number;
}

type ProductIdType = string;

export interface WSSnapshotMessage<PID extends ProductIdType = 'PI_XBTUSD'>
  extends GenericMessageFromServer {
  asks: OrderbookAsksType;
  bids: OrderbookBidsType;
  feed: 'book_ui_1_snapshot';

  numLevels: number;
  product_id: PID;
}

export interface WSUpdateMessage<PID extends ProductIdType = 'PI_XBTUSD'>
  extends GenericMessageFromServer {
  asks: OrderbookAsksType;
  bids: OrderbookBidsType;
  feed: 'book_ui_1';

  numLevels: number;
  product_id: PID;
}

export type OrderbookWSMessageType<PID extends ProductIdType = 'PI_XBTUSD'> =
  | WSSnapshotMessage<PID>
  | WSUpdateMessage<PID>;

export type OrderbookActionUpdate = 'u';
export type OrderbookActionSnapshot = 's';
type OrderbookDataUpdateActions =
  | OrderbookActionUpdate
  | OrderbookActionSnapshot;

export type WSUpdatesType = OrderbookGenericScopeDataType<OrdersMap>;

export interface PendingGroupUpdateRecord {
  kind: OrderbookDataUpdateActions;
  updates: WSUpdatesType;
}

export type OrdersMap = Map<number, Decimal>; // @todo-type: different types for pre-processed and post-processed values

export interface OrderbookStateType
  extends OrderbookGenericScopeDataType<OrdersMap> {
  groupBy: number;
  minGroupBy: number;
  grouped: OrderbookGenericScopeDataType<OrdersMap>;
  isLoading: boolean;
}

export type OrderbookReducerActionTypes =
  | 'RESET_STATE'
  | 'SET_GROUP_BY'
  | 'SET_LOADING'
  | 'UPDATE_GROUPED';

export interface OrderbookReducerAction {
  type: OrderbookReducerActionTypes;
  payload?: any;
}

export type OrderbookDispatch = React.Dispatch<OrderbookReducerAction>;

export type GenericMutatingFunctionType = ((
  object: unknown,
  key: string,
  value: number,
) => any) &
  ((a: unknown, b: string, c: number, ...d: any) => any);

export type OrderbookReducerCalculateGroupedPartialState = Pick<
  OrderbookStateType,
  'bids' | 'asks' | 'grouped'
>;

export type ProductId = string;

type OrderbookReducingFunction = (
  state: OrderbookStateType,
  action: OrderbookReducerAction,
) => OrderbookStateType;

export type ExchangeModuleMainReducerOverridesHash = {
  [type in OrderbookReducerActionTypes]: OrderbookReducingFunction;
};

export interface ExchangeModule {
  defaultOptions: {
    uri: string;

    defaultProduct: {
      pairName: ProductId;
      asset: {
        symbol: string;
        decimals: number;
        decimalsToShow: number;
      };
      price: {
        symbol: string;
        decimals: number;
        decimalsToShow: number;
      };
      groupByFactors: number[];
    };
    groupBy: number;
  };
  fakeRemote?:
    | void
    | ((
        orderBookDispatch: OrderbookDispatch,
        dispatchToQ: UseGeneratorQueueDispatch<PendingGroupUpdateRecord>,
      ) => Promise<unknown>);
  onMessage: (
    dispatchToQ: UseGeneratorQueueDispatch<PendingGroupUpdateRecord>,
  ) => (decoded: OrderbookWSMessageType) => void;
  onOpen: (
    orderBookDispatch: OrderbookDispatch,
    subscribeToProductId: ProductId,
  ) => (current: MutableRefObject<OwnRefType>) => void;
  mainReducerOverrides?: ExchangeModuleMainReducerOverridesHash;
}

export interface OrderbookProps {
  exchangeModule: ExchangeModule;
  numberOfRowsPerSection?: number;
  typeID?: string;
}

export type OrderbookReducerInitialState =
  | React.SetStateAction<OrderbookStateType>
  | OrderbookStateType;

export type OrderbookReducer = (
  state: OrderbookStateType,
  action: OrderbookReducerAction,
) => OrderbookStateType;

export interface OrderbookControllerHookReturn {
  orderBookDispatch: OrderbookDispatch;
  bidsData: [string, Decimal, Decimal][];
  asksData: [string, Decimal, Decimal][];
  isLoading: boolean;
  groupBy: number;
  minGroupBy: number;
  rowsPerSection?: number;
  wsState: WebSocketState;
}

export type AllScopePropertyNames = 'bids' | 'asks';
