import type {} from 'react';

export type OnMessageReceivedFunction<MFS extends GenericMessageFromServer> = (
  data: MFS,
) => void;

export type OnConnectFunction = (client: WebSocketInstanceType) => void;
export type OnDisconnectFunction = () => void;
export type OnErrorFunction = (err: Error) => void;

export type WebSocketNativeError = { isTrusted?: boolean; message: string };

export interface WebSocketHandlers<
  MFS extends GenericMessageFromServer = GenericMessageFromServer,
> {
  onMessage: OnMessageReceivedFunction<MFS> | null;
  onOpen: OnConnectFunction | null;
  onClose: OnDisconnectFunction | null;
  onError: OnErrorFunction | null;
}

export type UseWebSocketOptionalProps<
  MFS extends GenericMessageFromServer = GenericMessageFromServer,
> = Partial<WebSocketHandlers<MFS>>;

export interface UseWebSocketProperties<
  MFS extends GenericMessageFromServer = GenericMessageFromServer,
> extends UseWebSocketOptionalProps<MFS> {
  uri: string;
  autoReconnect?: boolean;
  reconnectCheckIntervalMs?: number;
}

export type GenericMessageFromServer = Record<string, any>;

export type WebSocketConnectFunction = () => Promise<boolean>;

export type GenericMessageToClient = Record<string | number, any>;

export type WebSocketSendFunction<
  MTC extends GenericMessageToClient = GenericMessageToClient,
> = (msgObj: MTC) => Promise<boolean>;

export type BindHandlersFunction<
  MFS extends GenericMessageFromServer = GenericMessageFromServer,
  MTC extends GenericMessageToClient = GenericMessageToClient,
> = (
  o: {
    send: WebSocketSendFunction<MTC>;
    dispatch: Dispatch;
  },
  handlers: WebSocketHandlers<MFS>,
) => Partial<WebSocketHandlers<MFS>>;

export interface WebSocketState extends Record<string, any> {
  isConnecting: boolean;
  isConnected: boolean;
  isLoading: boolean;
}

export type ReducerActionTypes =
  | 'SET_LOADING'
  | 'SET_CONNECTED'
  | 'SET_CONNECTING';

export interface ReducerAction {
  type: ReducerActionTypes;
  payload: any;
}

export type Reducer = (
  state: WebSocketState,
  action: ReducerAction,
) => WebSocketState;

export type Dispatch = React.Dispatch<ReducerAction>;

export type InitialState =
  | React.SetStateAction<WebSocketState>
  | WebSocketState;

export type WebSocketInstanceType = any;
