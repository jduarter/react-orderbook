import { useReducer, useMemo } from 'react';
import type {
  ReducerActionTypes,
  WebSocketState,
  InitialState,
  Dispatch,
  Reducer,
} from './types';

export const INITIAL_STATE = () => ({
  isLoading: true,
  isConnected: false,
  isConnecting: false,
  shouldReconnectNow: false,
});

export const webSocketStateReducer = (
  state: WebSocketState,
  action: { type: ReducerActionTypes; payload: any },
) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: !!action.payload.value };

    case 'SET_CONNECTED':
      return { ...state, isConnected: !!action.payload.value };

    case 'SET_CONNECTING':
      return {
        ...state,
        isConnecting: !!action.payload.value,
        isLoading: true,
      };

    default:
      throw new Error(
        'webSocketStateReducer: unknown action type <' + action.type + '>',
      );
  }
};

export const useWebSocketReducer = (
  initialState: InitialState = INITIAL_STATE,
): [WebSocketState, Dispatch] =>
  useReducer<Reducer>(
    webSocketStateReducer,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useMemo(() => initialState(), []) as WebSocketState,
  );
