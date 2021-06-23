import type { TimerHandler } from '@hooks/useTimerCallbacks';
import type { MutableRefObject } from 'react';

export type OnMessageReceivedFunction<MFS extends GenericMessageFromServer> = (
  data: MFS,
) => void;

export interface WebSocketNativeError {
  name?: string;
  isTrusted?: boolean;
  message: string;
}

export type GenericMessageFromServer = Record<string, any>;
export type GenericMessageToClient = Record<string | number, any>;

export type OnConnectFunction = (ref: MutableRefObject<OwnRefType>) => void;
export type OnDisconnectFunction = () => void;
export type OnErrorFunction = (err: WebSocketNativeError) => void;

export interface WebSocketHandlers<
  MFS extends GenericMessageFromServer = GenericMessageFromServer,
> {
  onMessage: OnMessageReceivedFunction<MFS> | null;
  onOpen: OnConnectFunction | null;
  onClose: OnDisconnectFunction | null;
  onError: OnErrorFunction | null;
}

export type WebSocketHandlerNames<
  MFS extends GenericMessageFromServer = GenericMessageFromServer,
> = keyof WebSocketHandlers<MFS>;

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

export type WebSocketConnectFunction = () => Promise<boolean>;

export type WebSocketSendFunction<
  MTC extends GenericMessageToClient = GenericMessageToClient,
> = (msgObj: MTC) => Promise<boolean>;

export type BindHandlersFunction<
  MFS extends GenericMessageFromServer = GenericMessageFromServer,
> = (
  o: MutableRefObject<OwnRefType>,
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

export type InitialState = () => WebSocketState;

export type WebSocketInstanceType = any;

export type OwnRefType = {
  connect: () => Promise<boolean>;
  send: (obj: any) => Promise<boolean>;
  dispatch: Dispatch;
  handlers: WebSocketHandlers & {
    onClose: OnCloseFnType;
    onOpen: OnOpenFnType;
  };
};

export type OnCloseFnType = () => void;
export type OnOpenFnType = (o: MutableRefObject<null | OwnRefType>) => void;

export interface UseHandlersWithReconnectProps {
  onClose: OnCloseFnType;
  onOpen: OnOpenFnType;
  reconnectTimer: TimerHandler;
}

export interface ReconnectHOCReturnType {
  onClose: OnCloseFnType;
  onOpen: OnOpenFnType;
}
