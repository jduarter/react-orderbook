import * as React from 'react';

import type {
    GenericMessageType,
    UseWebSocketProperties,
    BindHandlersFunction,
    WebSocketHandlers,
    WebSocketState,
    OtherExtraEventCallbacks,
    WebSocketInstanceType,
} from './types';

const voidFunction = ((): void => undefined) as any;

const bindHandlersToClient: BindHandlersFunction = (
    client,
    { onConnectionStatusChange, onMessageReceived },
): void => {
    console.log('bindHandlersToClient');
    client.onopen = () => {
        console.log('CLIENT ON OPEN');
        if (onConnectionStatusChange) {
            onConnectionStatusChange({ connected: true }, client);
        }
    };

    client.onmessage = ({ data }: { data?: string }) =>
        data && onMessageReceived && onMessageReceived(JSON.parse(data));

    client.onclose = () => {
        console.log('*** client.onClose');
        if (onConnectionStatusChange) {
            onConnectionStatusChange(
                { connected: false, connecting: false },
                client,
            );
        }
    };

    client.onerror = (error?: any) => {
        console.log('*** client.onerror:', error);
        // {"isTrusted": false, "message": "The operation couldn’t be completed. Network is down"}

        if (onConnectionStatusChange) {
            onConnectionStatusChange(
                { connected: false, connecting: false },
                client,
            );
        }
    };
};

const groupHandlersInObject = <
    MT extends GenericMessageType = GenericMessageType,
    S extends WebSocketState = WebSocketState,
>(
    o: Record<string, any>,
    fallback: typeof voidFunction = voidFunction,
): WebSocketHandlers<MT, S> & OtherExtraEventCallbacks =>
    Object.entries(o).reduce(
        (acc, [ok, ov]) => ({ ...acc, [ok]: ov || fallback }),
        {},
    ) as WebSocketHandlers<MT, S> & OtherExtraEventCallbacks;

const useWebSocket = <MT extends GenericMessageType = GenericMessageType>(
    properties: UseWebSocketProperties<MT>,
): WebSocketInstanceType => {
    console.log('useWebSocket called: ', properties);
    const {
        uri,
        onMessageReceived = voidFunction,
        onConnectionStatusChange = voidFunction,
    } = properties;

    const reference = React.useRef<WebSocket>();

    const connect = React.useCallback(() => {
        console.log('regenerating connect from useWebSocket');
        return async (): Promise<boolean> => {
            console.log('CONNECT!!!!!!');
            onConnectionStatusChange({ connected: false, connecting: true });

            const client = new WebSocket(uri) as WebSocketInstanceType;

            bindHandlersToClient(
                client,
                groupHandlersInObject({
                    onConnectionStatusChange,
                    onMessageReceived,
                }),
            );

            reference.current = client;

            return true;
        };
    }, [onConnectionStatusChange, onMessageReceived, uri]);

    React.useEffect(() => {
        console.log('[ws] opening connection');
        connect();
        return () => {
            console.log('closing connection');
            if (reference.current) {
                reference.current.close();
                reference.current = undefined;
            }
        };
    }, [uri, connect]);

    return React.useMemo(
        () => ({
            connect,
        }),
        [connect],
    );
};

export default useWebSocket;
