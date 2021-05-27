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
}

export type OrderbookReducerActionTypes =
    | 'CALCULATE_GROUPED'
    | 'ORDERBOOK_UPDATE'
    | 'ORDERBOOK_SNAPSHOT'
    | 'SET_GROUP_BY';

export interface OrderbookReducerAction {
    type: OrderbookReducerActionTypes;
    payload: any;
}

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
