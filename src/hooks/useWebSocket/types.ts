/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                               *
 *                    | react-native-orderbook |                 *
 *                                                               *
 *  License |  MIT General Public License                        *
 *  Author  |  Jorge Duarte Rodríguez <info@malagadev.com>       *
 *                                                               *
 *                            (c) 2021                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
type ProductIdType = 'PI_XBTUSD';

type OrderbookGenericFragmentType = [number, number];

type OrderbookBidType = OrderbookGenericFragmentType;
type OrderbookAskType = OrderbookGenericFragmentType;

type FeedType = 'book_ui_1';

type RawUpdateMessageFloat = number;

export interface WebSocketOrderbookSnapshotMessage<PID extends string = 'PI_XBTUSD'>
  extends GenericMessageType {
  asks: WebSocketOrderbookDataArray;
  bids: WebSocketOrderbookDataArray;
  feed: 'book_ui_1_snapshot';
  // feed: 'book_ui_1_snapshot';
  //{"numLevels":25,"feed":"book_ui_1_snapshot","bids":[[33893.5,2179.0],[33884.0,6113.0],[33876.5,6770.0],[33875.5,801.0],[33874.0,510.0],[33873.0,4605.0],[33872.5,6511.0],[33872.0,2374.0],[33871.5,10000.0],[33870.0,4305.0],[33869.5,4746.0],[33868.5,12932.0],[33868.0,2636.0],[33864.0,2500.0],[33862.0,30000.0],[33859.5,29924.0],[33858.0,150000.0],[33857.0,2650.0],[33855.0,93019.0],[33853.5,1946.0],[33853.0,1844.0],[33852.5,57530.0],[33851.5,3623.0],[33850.5,176027.0],[33847.5,11496.0]],"asks":[[33900.0,29594.0],[33914.5,4674.0],[33917.0,820.0],[33921.0,169817.0],[33931.5,538.0],[33932.5,3047.0],[33933.0,450.0],[33933.5,5381.0],[33934.5,27596.0],[33935.5,20000.0],[33936.0,3638.0],[33937.0,200.0],[33937.5,25009.0],[33938.0,20000.0],[33938.5,150000.0],[33939.5,20000.0],[33940.5,3315.0],[33941.0,2656.0],[33942.5,3749.0],[33943.5,801.0],[33944.0,118676.0],[33947.0,1880.0],[33948.5,194374.0],[33949.0,62328.0],[33952.0,2007.0]],"product_id":"PI_XBTUSD"}  1621810798.654533

  numLevels: number;
  product_id: PID;
}

export interface WebSocketOrderbookUpdateMessage<PID extends string = 'PI_XBTUSD'>
  extends GenericMessageType {
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

export type OnMessageReceivedFunction<MT extends GenericMessageType> = (data: MT) => void;

export interface WebSocketHandlers<
  MT extends GenericMessageType = GenericMessageType,
  S = WebSocketState,
> {
  onConnectionStatusChange: onConnectionStatusChangeFunction<S> | null;
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

export type WebSocketOrderbookSizePricePair = [RawUpdateMessageFloat, RawUpdateMessageFloat];

export type WebSocketOrderbookDataArray = WebSocketOrderbookSizePricePair[];

export type WebSocketConnectFunction = () => Promise<boolean>;

export interface OtherExtraEventCallbacks { connect: WebSocketConnectFunction }

type onConnectionStatusChangeFunction<S = WebSocketState> = (
  s: Partial<S>,
  c?: WebSocket | null,
) => void;

type RestOfArguments<MT extends GenericMessageType = GenericMessageType, S = WebSocketState> =
  WebSocketHandlers<MT, S> & OtherExtraEventCallbacks;

type WebSocketHandlersBinderArguments<
  MT extends GenericMessageType = GenericMessageType,
  S = WebSocketState,
  A = RestOfArguments<MT, S>,
> = [WebSocket, A];

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
