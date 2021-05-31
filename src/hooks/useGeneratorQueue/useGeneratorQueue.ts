import { useCallback, useRef, useMemo } from 'react';
import { getThrowableError } from '@utils/getThrowableError';

import type { UseGeneratorQueueReturn } from './types';

const DEFAULT_QUEUE_MAX_SIZE = 1024;

interface GeneratorQueueOptions {
  queueMaxSize: number;
  throwErrorOnMaxSizeReach: boolean;
}

const GeneratorQueueError = getThrowableError(
  'GeneratorQueueError',
  (userMessage: string, details?: { originalError?: Error }) => ({
    userMessage,
    originalError: details?.originalError || undefined,
  }),
);

const useGeneratorQueue = <T>(
  initialState: T[] = [],
  opts: GeneratorQueueOptions = {
    queueMaxSize: DEFAULT_QUEUE_MAX_SIZE,
    throwErrorOnMaxSizeReach: true,
  },
): UseGeneratorQueueReturn<T> => {
  const ref = useRef<T[]>(initialState);
  const dispatchToQ = useCallback(
    (payload: T[]): number => {
      const currCount = ref.current.push(...payload);
      if (currCount > opts.queueMaxSize) {
        if (opts.throwErrorOnMaxSizeReach === true) {
          throw new GeneratorQueueError(
            'Queue max size reached: ' + currCount + ' > ' + opts.queueMaxSize,
          );
        }
      }
      return currCount;
    },
    [opts.queueMaxSize, opts.throwErrorOnMaxSizeReach],
  );

  const consumeQ = useCallback(function* (limit: number | null = 1) {
    if (ref.current.length === 0) {
      console.log(' ++ called consumeQ and length is 0');
      return;
    }

    if (limit === null) {
      yield ref.current.splice(-ref.current.length).reverse();
    } else {
      yield ref.current.splice(limit);
    }
  }, []);

  return useMemo(() => ({ dispatchToQ, consumeQ }), [dispatchToQ, consumeQ]);
};

export default useGeneratorQueue;
