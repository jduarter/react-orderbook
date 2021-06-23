import { useIntervalCallback } from '@hooks/useTimerCallbacks';
import type { TimerHandler } from '@hooks/useTimerCallbacks';

import { useCallback } from 'react';

import type { MutableRefObject } from 'react';
import type {
  UseHandlersWithReconnectProps,
  OwnRefType,
  ReconnectHOCReturnType,
} from './types';

export const withReconnect = ({
  reconnectTimer,
  onClose,
  onOpen,
}: UseHandlersWithReconnectProps): ReconnectHOCReturnType => {
  const onLocalClose = () => {
    if (!reconnectTimer.isStarted()) {
      reconnectTimer.start();
    }

    onClose();
  };

  const onLocalOpen = (aRef: MutableRefObject<null | OwnRefType>) => {
    if (reconnectTimer.isStarted()) {
      reconnectTimer.finish();
    }
    onOpen(aRef);
  };

  return { onClose: onLocalClose, onOpen: onLocalOpen };
};

export const useReconnectTimer = (
  autoReconnect: boolean,
  isConnecting: boolean,
  reconnectCheckIntervalMs: number,
  ref: MutableRefObject<OwnRefType | null>,
): TimerHandler =>
  useIntervalCallback(
    reconnectCheckIntervalMs,
    useCallback(() => {
      if (autoReconnect && isConnecting === false && ref?.current?.connect) {
        ref.current.connect();
      }
    }, [isConnecting]),
  );
