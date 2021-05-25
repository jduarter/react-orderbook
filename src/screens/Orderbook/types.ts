import type { WebSocketOrderbookDataArray } from '../../hooks/useWebSocket';

export type OrderbookGroupedPrice = number;
export type OrderbookNormalizedPrice = string;

export type OrderbookOrderSize = number;
export type OrderbookOrdersSortedObject = Record<
  OrderbookNormalizedPrice,
  OrderbookOrderSize
>;

export type OrderbookGenericScopeDataType<T> = {
  bids: T;
  asks: T;
};

export type OrderbookActionUpdate = 'u';
export type OrderbookActionSnapshot = 's';
type OrderbookDataUpdateActions =
  | OrderbookActionUpdate
  | OrderbookActionSnapshot;

export type WebSocketOrderbookUpdatesType =
  OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>;

export type PendingGroupUpdateRecord = {
  kind: OrderbookDataUpdateActions;
  updates: WebSocketOrderbookUpdatesType;
  selectedLastState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>;
};

export interface OrderbookStateType
  extends OrderbookGenericScopeDataType<OrderbookOrdersSortedObject> {
  groupBy: number;
  grouped: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>;
  pendingGroupUpdates: Array<PendingGroupUpdateRecord>;
}

export type OrderbookReducerActionTypes =
  | 'CALCULATE_GROUPED'
  | 'ORDERBOOK_UPDATE'
  | 'ORDERBOOK_SNAPSHOT'
  | 'SET_GROUP_BY';

export type OrderbookReducerAction = {
  type: OrderbookReducerActionTypes;
  payload: any;
};

export type GenericMutatingFunctionType = ((
  obj: unknown,
  key: string,
  val: number,
) => any) &
  ((a: unknown, b: string, c: number, ...d: any) => any);

export type OrderbookReducerCalculateGroupedPartialState = Pick<
  OrderbookStateType,
  'pendingGroupUpdates' | 'bids' | 'asks' | 'grouped'
>;
