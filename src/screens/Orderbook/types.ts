import type { GenericMessageFromServer } from '../../hooks/useWebSocket';

export type OrderbookGroupedPrice = number;
export type OrderbookNormalizedPrice = string;

export type OrderbookOrderSize = number;
export type OrderbookOrdersSortedObject = Record<
  OrderbookNormalizedPrice,
  OrderbookOrderSize
>;

export interface OrderbookGenericScopeDataType<T> {
  bids: T;
  asks: T;
}

type OrderbookBidsType = OrdersMap;
type OrderbookAsksType = OrdersMap;

export interface UseOrderbookConnectionProperties {
  orderBookDispatch: OrderbookDispatch;
  webSocketUri: string;
  subscribeToProductIds: string[];
  reconnectCheckIntervalMs?: number;
  autoReconnect?: boolean;
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

export type OrdersMap = Map<number, number>;

export interface OrderbookStateType
  extends OrderbookGenericScopeDataType<OrdersMap> {
  groupBy: number;
  grouped: OrderbookGenericScopeDataType<OrdersMap>;
  isLoading: boolean;
}

export type OrderbookReducerActionTypes =
  | 'CALCULATE_GROUPED'
  | 'ORDERBOOK_UPDATE'
  | 'ORDERBOOK_SNAPSHOT'
  | 'SET_GROUP_BY'
  | 'SET_LOADING'
  | 'UPDATE_GROUPED';

export interface OrderbookReducerAction {
  type: OrderbookReducerActionTypes;
  payload: any;
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

export interface OrderbookProps {
  initialGroupBy?: number;
  productId: string;
  webSocketUri: string;
  numberOfRowsPerSection?: number;
}

export type OrderbookReducerInitialState =
  | React.SetStateAction<OrderbookStateType>
  | OrderbookStateType;

export type OrderbookReducer = (
  state: OrderbookStateType,
  action: OrderbookReducerAction,
) => OrderbookStateType;
