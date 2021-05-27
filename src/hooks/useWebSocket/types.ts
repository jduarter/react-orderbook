type ProductIdType = 'PI_XBTUSD';

type OrderbookGenericFragmentType = [number, number];

type OrderbookBidType = OrderbookGenericFragmentType;
type OrderbookAskType = OrderbookGenericFragmentType;

type FeedType = 'book_ui_1';

type RawUpdateMessageFloat = number;

type WebSocketClientInstance = any;

export interface WebSocketOrderbookSnapshotMessage<
    PID extends string = 'PI_XBTUSD',
> extends GenericMessageType {
    asks: WebSocketOrderbookDataArray;
    bids: WebSocketOrderbookDataArray;
    feed: 'book_ui_1_snapshot';

    numLevels: number;
    product_id: PID;
}

export interface WebSocketOrderbookUpdateMessage<
    PID extends string = 'PI_XBTUSD',
> extends GenericMessageType {
    asks: WebSocketOrderbookDataArray;
    bids: WebSocketOrderbookDataArray;
    feed: 'book_ui_1';

    numLevels: number;
    product_id: PID;
}

export interface OrderbookWSMessageType {
    feed: FeedType;
    product_id: ProductIdType;
    bids: OrderbookBidType[];
    asks: OrderbookAskType[];
}

export type OnMessageReceivedFunction<MT extends GenericMessageType> = (
    data: MT,
) => void;

export interface WebSocketHandlers<
    MT extends GenericMessageType = GenericMessageType,
    S = WebSocketState,
> {
    onConnectionStatusChange: OnConnectionStatusChangeFunction<S> | null;
    onMessageReceived: OnMessageReceivedFunction<MT> | null;
}

export type UseWebSocketOptionalProps<
    MT extends GenericMessageType = GenericMessageType,
    S = WebSocketState,
> = Partial<WebSocketHandlers<MT, S>>;

export interface UseWebSocketProperties<
    MT extends GenericMessageType = GenericMessageType,
    S = WebSocketState,
> extends UseWebSocketOptionalProps<MT, S> {
    uri: string;
}

export type GenericMessageType = Record<string, any>;

export type WebSocketOrderbookSizePricePair = [
    RawUpdateMessageFloat,
    RawUpdateMessageFloat,
];

export type WebSocketOrderbookDataArray = WebSocketOrderbookSizePricePair[];

export type WebSocketConnectFunction = () => Promise<boolean>;

export interface OtherExtraEventCallbacks {
    connect: WebSocketConnectFunction;
}

type OnConnectionStatusChangeFunction<S = WebSocketState> = (
    s: Partial<S>,
    c?: WebSocketClientInstance | null,
) => void;

type RestOfArguments<
    MT extends GenericMessageType = GenericMessageType,
    S = WebSocketState,
> = WebSocketHandlers<MT, S> & OtherExtraEventCallbacks;

type WebSocketHandlersBinderArguments<
    MT extends GenericMessageType = GenericMessageType,
    S = WebSocketState,
    A = RestOfArguments<MT, S>,
> = [WebSocketInstanceType, A];

export type BindHandlersFunction<
    MT extends GenericMessageType = GenericMessageType,
    S = WebSocketState,
    A = RestOfArguments<MT, S>,
> = (...arguments_: WebSocketHandlersBinderArguments<MT, S, A>) => void;

export interface WebSocketState extends Record<string, any> {
    connecting: boolean;
    connected: boolean;
}

export type WebSocketInstanceType = any;
