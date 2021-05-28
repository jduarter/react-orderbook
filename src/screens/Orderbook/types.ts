import type { WebSocketOrderbookDataArray } from '../../hooks/useWebSocket';

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

export type OrderbookActionUpdate = 'u';
export type OrderbookActionSnapshot = 's';
type OrderbookDataUpdateActions =
  | OrderbookActionUpdate
  | OrderbookActionSnapshot;

export type WebSocketOrderbookUpdatesType =
  OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>;

export interface PendingGroupUpdateRecord {
  kind: OrderbookDataUpdateActions;
  updates: WebSocketOrderbookUpdatesType;
  //   selectedLastState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>;
}

export interface OrderbookStateType
  extends OrderbookGenericScopeDataType<OrderbookOrdersSortedObject> {
  groupBy: number;
  grouped: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>;
  pendingGroupUpdates: PendingGroupUpdateRecord[];
  options: {
    disableTwoWayProcessing: boolean;
  };
  isLoading: boolean;
  groupKeysUpdated: {
    bids: Record<string, number>;
    asks: Record<string, number>;
  };
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
  'pendingGroupUpdates' | 'bids' | 'asks' | 'grouped'
>;

export interface OrderbookProps {
  initialGroupBy?: number;
  productId: string;
  webSocketUri: string;
}

export type OrderbookReducerInitialState =
  | React.SetStateAction<OrderbookStateType>
  | OrderbookStateType;

export type OrderbookReducer = (
  state: OrderbookStateType,
  action: OrderbookReducerAction,
) => OrderbookStateType;
