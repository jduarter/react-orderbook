import { useCallback, useRef, useMemo } from 'react';
import { getThrowableError } from 'throwable-error';

import { useLogScope } from '../../services/AppLog';

import type {
  UseGeneratorQueueReturn,
  ErrorArgs,
  ErrorDetails,
  GeneratorQueueOptions,
} from './types';

const DEFAULT_QUEUE_MAX_SIZE = 1024;

export const GeneratorQueueError = getThrowableError<ErrorArgs>(
  'GeneratorQueueError',
  {
    mapperFn: (userMessage: string, details?: ErrorDetails) => ({
      userMessage,
      originalError: undefined,
      ...(details ? details : {}),
    }),
  },
);

/*
 * the maximum length of an array according to the ECMA-262 5th Edition specification is
 * bound by an unsigned 32-bit integer due to the ToUint32 abstract operation, so the
 * longest possible array could have 232-1 = 4,294,967,295 = 4.29 billion elements.
 */
const HARD_MAX_QUEUE_ARRAY_SIZE = 4294967295;

/* The limit is determined by: The FixedArray backing store of the Map has a maximum size
 * of 1GB (independent of the overall heap size limit) On a 64-bit system that
 * means 1GB / 8B => 2^30 / 2^3 => 2^27 ~= 134M
 *
 * A Map needs 3 elements per entry (key, value, next bucket link), and has a maximum load
 * factor of 50% (to avoid the slowdown caused by many bucket collisions), and its capacity
 * must be a power of 2. 2^27 / (3 * 2) rounded down to the next power of 2 is 2^24
 */
// const HARD_MAX_QUEUE_MAP_SIZE = 16777216;

// @todo: extract this logic, use reflect-metadata to try to use types in runtime for automagic validation
const USE_GENERATOR_QUEUE_INPUT_VALIDATORS = {
  queueMaxSize: (v: number) =>
    typeof v === 'number' && v < HARD_MAX_QUEUE_ARRAY_SIZE && v > 0,
  throwErrorOnMaxSizeReach: (v: boolean) => typeof v === 'boolean',
  kind: (v: 'FIFO') => v === 'FIFO',
  initialState: (v: any) => typeof v === 'object' && Array.isArray(v) === true,
};

type ValidatorsDefType<
  VT extends unknown = unknown,
  K extends string = string,
> = Record<K, (v: VT) => boolean>;

const validateInputNames = <
  V extends ValidatorsDefType<unknown> = ValidatorsDefType<any>,
>(
  input: Record<string & Partial<keyof V>, any>,
  validators: V,
) =>
  Object.keys(input).map((inputName) => ({
    inputName,
    valid: validators[inputName](input[inputName]),
  }));

const assertArgsAreValid = <
  V extends ValidatorsDefType<any> = ValidatorsDefType<any>,
>(
  input: Record<string & Partial<keyof V>, any>,
  validators: V,
) => {
  const inputErrors = validateInputNames(input, validators).filter(
    (o) => o.valid === false,
  );

  if (inputErrors.length === 0) {
    return;
  }

  throw new GeneratorQueueError(
    'Invalid arguments passed to useGeneratorQueue()',
    { inputErrors, type: 'INVALID_HOOK_ARGS' },
  );
};

const useGeneratorQueue = <T>(
  initialState: T[] = [],
  opts: GeneratorQueueOptions = {
    queueMaxSize: DEFAULT_QUEUE_MAX_SIZE,
    throwErrorOnMaxSizeReach: true,
    kind: 'FIFO',
  },
): UseGeneratorQueueReturn<T> => {
  const Log = useLogScope('useGeneratorQueue');

  assertArgsAreValid(
    { ...opts, initialState },
    USE_GENERATOR_QUEUE_INPUT_VALIDATORS,
  );

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

    const result = !limit
      ? ref.current.splice(-ref.current.length)
      : ref.current.splice(0, limit);

    Log.debug('CONSUMED_ELEMENTS', {
      amount: result.length,
    });

    yield result;
  }, []);

  return useMemo(() => ({ dispatchToQ, consumeQ }), [dispatchToQ, consumeQ]);
};

export default useGeneratorQueue;
