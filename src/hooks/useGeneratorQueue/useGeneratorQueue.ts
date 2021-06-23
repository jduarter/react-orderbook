import { useCallback, useRef, useMemo } from 'react';
import { getThrowableError } from 'throwable-error';

import type {
  UseGeneratorQueueReturn,
  ErrorArgs,
  ErrorDetails,
  GeneratorQueueOptions,
} from './types';

const DEFAULT_QUEUE_MAX_SIZE = 1024;

const GeneratorQueueError = getThrowableError<ErrorArgs>(
  'GeneratorQueueError',
  {
    mapperFn: (userMessage: string, details?: ErrorDetails) => ({
      userMessage,
      originalError: details?.originalError || undefined,
    }),
  },
);

const useGeneratorQueue = <T>(
  initialState: T[] = [],
  opts: GeneratorQueueOptions = {
    queueMaxSize: DEFAULT_QUEUE_MAX_SIZE,
    throwErrorOnMaxSizeReach: true,
    kind: 'FIFO',
  },
): UseGeneratorQueueReturn<T> => {
  const ref = useRef<T[]>(initialState);
  const dispatchToQ = useCallback(
    (payload: T[]): number => {
      const currCount = ref.current.push(...payload);

      if (
        currCount > opts.queueMaxSize &&
        opts.throwErrorOnMaxSizeReach === true
      ) {
        throw new GeneratorQueueError(
          'Queue max size reached: ' + currCount + ' > ' + opts.queueMaxSize,
        );
      }

      return currCount;
    },
    [opts.queueMaxSize, opts.throwErrorOnMaxSizeReach],
  );

  const consumeQ = useCallback(function* (limit: number | null = 1) {
    if (ref.current.length === 0) {
      return;
    }

    yield (
      !limit
        ? ref.current.splice(-ref.current.length)
        : ref.current.splice(0, limit)
    ).reverse();
  }, []);

  return useMemo(() => ({ dispatchToQ, consumeQ }), [dispatchToQ, consumeQ]);
};

export default useGeneratorQueue;
