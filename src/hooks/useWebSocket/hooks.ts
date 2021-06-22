import { useMemo, useCallback } from 'react';

import type {
  BindHandlersFunction,
  GenericMessageFromServer,
  WebSocketNativeError,
  OnMessageReceivedFunction,
} from './types';

import { WebSocketError, WebSocketJSONError } from './errors';

const voidFunction = ((): void => undefined) as any;

const genOnMessageHandler =
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

export const useHandlers: BindHandlersFunction = (
  { send, dispatch },
  { onMessage, onOpen, onClose, onError },
) => {
  const onOpenHandler = useCallback(() => {
    if (onOpen) {
      onOpen({ send });
    }

    dispatch({ type: 'SET_CONNECTED', payload: { value: true } });
  }, [send, onOpen, dispatch]);

  const onMessageHandler = useCallback(
    onMessage ? genOnMessageHandler(onMessage) : voidFunction,
    [onMessage],
  );

  const onCloseHandler = useCallback(() => {
    dispatch({ type: 'SET_CONNECTED', payload: { value: false } });
    dispatch({ type: 'SET_CONNECTING', payload: { value: false } });

    if (onClose) {
      onClose();
    }
  }, [onClose, dispatch]);

  const onErrorHandler = useCallback(
    (error: WebSocketNativeError) => {
      onCloseHandler();
      if (onError) {
        onError(error);
      }
      // {"isTrusted": false, "message": "The operation couldn’t be completed. Network is down"}
    },
    [onCloseHandler, onError],
  );

  return useMemo(
    () => ({
      onOpen: onOpenHandler,
      onClose: onCloseHandler,
      onError: onErrorHandler,
      onMessage: onMessageHandler,
    }),
    [onOpenHandler, onCloseHandler, onErrorHandler, onMessageHandler],
  );
};
