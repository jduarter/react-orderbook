import { useRef, useMemo, useEffect, useCallback } from 'react';

import type { UseGenericTimerCallbackKind, TimerHandler } from './types';

export const useGenericTimerCallback = <T = NodeJS.Timeout | number>(
  [setF, clearF]: UseGenericTimerCallbackKind,
  ms: number,
  cleanupAtFirstExecution: boolean,
  callback: (...args: any[]) => void,
): TimerHandler => {
  const ref = useRef<T | undefined>();

  const finish = useCallback(() => {
    console.log('[reconnectTimer] finish');

    if (!ref.current) {
      return;
    }

    clearF(ref.current as unknown as number);
    ref.current = undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runClosure = useCallback(() => {
    callback(finish);
    if (cleanupAtFirstExecution) {
      ref.current = undefined;
    }
  }, [cleanupAtFirstExecution, callback, finish]);

  const start = useCallback(() => {
    if (ref.current !== undefined) {
      console.warn(
        'useGenericTimerCallback: trying to start when there is already a timer',
      );
      return;
    }

    ref.current = setF(runClosure, ms) as unknown as T;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, runClosure]);

  const isStarted = useCallback(() => ref.current !== undefined, []);

  useEffect(() => {
    return () => {
      finish();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMemo(
    () => ({ start, finish, isStarted }),
    [start, finish, isStarted],
  );
};

export const useTimeoutCallback = (
  ms: number,
  callback: (...args: any[]) => void,
): TimerHandler =>
  useGenericTimerCallback<NodeJS.Timeout>(
    // eslint-disable-next-line no-restricted-globals
    [setTimeout, clearTimeout],
    ms,
    true,
    callback,
  );

export const useIntervalCallback = (
  ms: number,
  callback: (...args: any[]) => void,
): TimerHandler =>
  useGenericTimerCallback<number>(
    [setInterval, clearInterval], // eslint-disable-line no-restricted-globals
    ms,
    false,
    callback,
  );
