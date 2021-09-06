import type { MutableRefObject } from 'react';
import type {
  WebSocketNativeError,
  OwnRefType,
  WebSocketHandlers,
  OnMessageReceivedFunction,
  GenericMessageFromServer,
  OnCloseFnType,
  WebSocketInstanceType,
} from './types';

import { WebSocketError, WebSocketJSONError } from './errors';

export const bindHandlersToWebSocketRef = (
  ref: MutableRefObject<WebSocketInstanceType>,
  handlers: Partial<WebSocketHandlers<any>>,
): void => {
  ref.current.onopen = handlers.onOpen || null;
  ref.current.onmessage = handlers.onMessage || null;
  ref.current.onclose = handlers.onClose || null;
  ref.current.onerror = handlers.onError || null;
};

const generateOnMessageHandler =
  <MFS extends GenericMessageFromServer = GenericMessageFromServer>(
    onMessage: OnMessageReceivedFunction<MFS>,
  ) =>
  ({ data }: { data?: string }): void => {
    if (!onMessage) {
      throw new WebSocketError('onMessageReceive handler is null.');
    }

    if (!data) {
      return;
    }

    try {
      let decoded;
      try {
        decoded = JSON.parse(data);
      } catch (err: any) {
        throw new WebSocketJSONError(
          'onMessageReceive: could not decode JSON-parsed data!',
          { originalError: err, data },
        );
      }
      onMessage(decoded);
    } catch (err: any) {
      if (err instanceof WebSocketJSONError) {
        throw err;
      } else {
        throw new WebSocketError(
          'onMessageReceive: unexpected error, probably due exception raised in onMessage() handler.',
          { originalError: err },
        );
      }
    }
  };

export const getConnectedHandler = ({
  handlerName,
  originalHandler,
  ownRef,
}: {
  handlerName: string;
  originalHandler: WebSocketHandlers<any>[keyof WebSocketHandlers<any>];
  ownRef: MutableRefObject<null | OwnRefType>;
}) => {
  const onOpen = (/*originalWsEvent: { isTrusted?: boolean }*/): void => {
    originalHandler && originalHandler(ownRef);
    ownRef?.current?.dispatch({
      type: 'SET_CONNECTED',
      payload: { value: true },
    });
  };

  const onClose = () => {
    ownRef?.current?.dispatch({
      type: 'SET_CONNECTED',
      payload: { value: false },
    });
    ownRef?.current?.dispatch({
      type: 'SET_CONNECTING',
      payload: { value: false },
    });

    if (originalHandler) {
      (originalHandler as OnCloseFnType)();
    }
  };

  const onError = (error: WebSocketNativeError) => {
    onClose();
    if (originalHandler) {
      originalHandler(error);
    }
    // {"isTrusted": false, "message": "The operation couldn’t be completed. Network is down"}
  };

  const connectedHandlers: WebSocketHandlers<any> = {
    onOpen,
    onClose,
    onError,
    onMessage: generateOnMessageHandler(
      originalHandler as OnMessageReceivedFunction<any>,
    ),
  };

  return {
    [handlerName]:
      connectedHandlers[handlerName as keyof typeof connectedHandlers],
  };
};

export const withConnectedHandlers = <
  I extends OwnRefType['handlers'] = OwnRefType['handlers'],
>(
  input: Partial<Record<keyof I, any>>,
  ownRef: MutableRefObject<null | OwnRefType>,
): I =>
  Object.keys(input).reduce((acc, handlerName) => {
    return {
      ...acc,
      ...getConnectedHandler({
        handlerName,
        originalHandler: input[handlerName as keyof I],
        ownRef,
      }),
    };
  }, {} as I);
