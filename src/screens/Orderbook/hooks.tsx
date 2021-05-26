/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                    | react-native-orderbook |                 *
 *                                                               *
 *  License |  MIT General Public License                        *
 *  Author  |  Jorge Duarte Rodríguez <info@malagadev.com>       *
 *                                                               *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
import * as React from 'react';

import type {
    OrderbookWSMessageType,
    WebSocketOrderbookSnapshotMessage,
    WebSocketOrderbookUpdateMessage,
} from '../../hooks/useWebSocket';
import { useWebSocket } from '../../hooks/useWebSocket';
import { orderBookReducer, INITIAL_ORDERBOOK_STATE } from './reducers';

// import { useDebounceCallback } from '@react-hook/debounce';

import * as NetInfo from '../../services/NetInfo';

import type { OrderbookStateType, OrderbookReducerAction } from './types';

interface ConnectionStatusState {
    color: string;
    connectedToInternet: boolean;
    websocket: {
        connected: boolean;
        connecting: boolean;
    };
}

const WEBSOCKET_URI = 'wss://www.cryptofacilities.com/ws/v1';

// @todo: better abstraction ws-orderbook (onX events for abstraction)
interface UserOrderbookConnectionProperties {
    orderBookDispatch: React.Dispatch<OrderbookReducerAction>;
}

export const useOrderbookController = (): UserOrderbookConnectionProperties & {
    orderBook: OrderbookStateType;
    connectionStatus: ConnectionStatusState;
} => {
    const [orderBook, orderBookDispatch] = useOrderbookReducer();
    const { connectionStatus } = useOrderbookConnection({ orderBookDispatch });
    return React.useMemo(
        () => ({ orderBook, orderBookDispatch, connectionStatus }),
        [connectionStatus, orderBook],
    );
};

type IsMountedFunctionType = () => boolean;
type UseSafeEffectDestructor = () => void;

type UseSafeEffectEffect = (
    m: IsMountedFunctionType,
) => void | UseSafeEffectDestructor;

const useSafeEffect = (
    effect: UseSafeEffectEffect,
    deps?: React.DependencyList,
) => {
    console.log('useSafeEffect renders');
    const ref = React.useRef<boolean>(false);
    React.useEffect(() => {
        ref.current = true;
        return () => {
            ref.current = false;
        };
    }, []);
    const isMounted = React.useCallback(() => ref.current, []);
    React.useEffect(() => {
        if (ref.current === true) {
            const rtn = effect(isMounted);
            return rtn;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...(deps ? deps : []), effect]);

    return React.useMemo<{ isMounted: IsMountedFunctionType }>(
        () => ({ isMounted }),
        [],
    );
};

const useTimeoutCallback = (
    timeoutMs: number,
    callback: (...args: any[]) => void,
) => {
    console.log('useTimeoutCallback renders');
    const ref = React.useRef<number | undefined>();

    const runClosure = React.useCallback(() => {
        console.log('[reconnectTimer] RUN');
        callback();
        ref.current = undefined;
    }, [callback]);

    const start = React.useCallback(() => {
        console.log('[reconnectTimer] start');
        if (ref.current !== null) {
            console.warn(
                'useTimeoutCallback: trying to start when there is already a timer',
            );
            return;
        }

        ref.current = setTimeout(runClosure, callback);
    }, [callback, runClosure]);

    const finish = React.useCallback(() => {
        console.log('[reconnectTimer] finish');
        if (!ref.current) {
            return;
        }

        clearTimeout(ref.current);
        ref.current = undefined;
    }, []);

    React.useEffect(() => {
        return () => {
            finish();
        };
    }, [start, finish]);

    return React.useMemo(() => ({ start, finish }), [start, finish]);
};

export const useOrderbookConnection = ({
    orderBookDispatch,
}: UserOrderbookConnectionProperties): {
    connectionStatus: ConnectionStatusState;
} => {
    const { isConnected, isInternetReachable } = NetInfo.useNetInfo();

    const [connectionStatus, setConnectionStatus] =
        React.useState<ConnectionStatusState>({
            color: 'white',
            connectedToInternet: false,
            websocket: {
                connected: false,
                connecting: false,
            },
        });

    //reduceByGroupNumber
    const onMessageReceived = React.useCallback((decoded) => {
        if (decoded?.event === 'info' || decoded?.event === 'subscribed') {
            console.log({ decoded });
        } else {
            if (!decoded?.event) {
                if (decoded?.feed === 'book_ui_1') {
                    orderBookDispatch({
                        type: 'ORDERBOOK_UPDATE',
                        payload: {
                            updates:
                                decoded as WebSocketOrderbookUpdateMessage<any>[],
                        },
                    });
                } else if (decoded?.feed === 'book_ui_1_snapshot') {
                    orderBookDispatch({
                        type: 'ORDERBOOK_SNAPSHOT',
                        payload: {
                            updates:
                                decoded as WebSocketOrderbookSnapshotMessage<any>[],
                        },
                    });
                } else {
                    console.log('(2)', { decoded });
                }
            } else {
                console.log('(2)', { decoded });
            }
        }
    }, []);

    const reconnectTimer = useTimeoutCallback(
        5000,
        React.useCallback(
            (connect: () => void, connectedToInternet: boolean): void => {
                console.log('[reconnectTimer]');
                if (connectedToInternet === true) {
                    console.log('should retry reconnect NOW');
                    connect();
                } else {
                    console.log('should retry reconnect after internet comes');
                }
            },
            [],
        ),
    );

    const onConnectionStatusChange = React.useCallback(
        (status, client): void => {
            console.log('onConnectionStatusChange:', status);
            if (status.connected === true) {
                client.send(
                    JSON.stringify({
                        event: 'subscribe',
                        feed: 'book_ui_1',
                        product_ids: ['PI_XBTUSD'],
                    }),
                );
                setConnectionStatus((st) => ({
                    ...st,
                    websocket: {
                        ...st.websocket,
                        connected: true,
                        connecting: false,
                    },
                }));
                return;
            } else if (status.connected === false) {
                setConnectionStatus((st) => ({
                    ...st,
                    websocket: {
                        ...st.websocket,
                        connected: false,
                        connecting: false,
                    },
                }));

                reconnectTimer.start();
                return;
            }

            setConnectionStatus((st) => ({
                ...st,
                websocket: { ...st.websocket, ...status },
            }));
        },
        [reconnectTimer],
    );

    const { connect } = useWebSocket<OrderbookWSMessageType>({
        uri: WEBSOCKET_URI,
        onMessageReceived,
        onConnectionStatusChange,
    });

    const mainEffect = React.useCallback(
        (isMounted) => {
            if (!isMounted()) {
                return;
            }
            console.log('INSIDE USE SAFE EFFECT !!', {
                isConnected,
                isInternetReachable,
            });

            if (isConnected) {
                if (isInternetReachable) {
                    setConnectionStatus((st) => ({
                        ...st,
                        color: 'green',
                        connectedToInternet: true,
                    }));
                    console.log('internet is now reachable');
                } else {
                    setConnectionStatus((st) => ({
                        ...st,
                        color: 'yellow',
                        connectedToInternet: false,
                    }));
                }
            } else {
                setConnectionStatus((st) => ({
                    ...st,
                    color: 'red',
                    connectedToInternet: false,
                }));
            }
        },
        [isConnected, isInternetReachable, connect],
    );

    useSafeEffect(mainEffect, []);

    console.log('useOrderbookConnection renders: ', connectionStatus);

    return { connectionStatus };
};

export const useOrderbookReducer = () =>
    React.useReducer<typeof orderBookReducer>(
        orderBookReducer,
        INITIAL_ORDERBOOK_STATE,
    );
/*
type OnProcessCycle = () => void;

interface UseOrderbookProcessingProperties {
    onProcessCycle: OnProcessCycle;
    orderBook: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>;
}

export const useOrderbookProcessing = ({
    onProcessCycle,
    orderBook,
}: UseOrderbookProcessingProperties) => {
    //  const calculateGrouped = useDebounceCallback(onProcessCycle, 125);

    React.useEffect(() => {
        const intval = setInterval(() => {
            onProcessCycle();
        }, 500); // calculateGrouped();
        return () => {
            if (intval) clearInterval(intval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {};
};
*/
