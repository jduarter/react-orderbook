import { useCallback, useRef, useMemo } from 'react';

import type { UseGeneratorQueueReturn } from './types';

const useGeneratorQueue = <T>(
  initialState: T[] = [],
): UseGeneratorQueueReturn<T> => {
  const ref = useRef<T[]>(initialState);
  const dispatchFromQ = useCallback((payload) => {
    for (const item of payload) {
      ref.current.push(item);
    }
  }, []);

  const consumeQ = useCallback(function* () {
    yield ref.current.shift();
  }, []);

  return useMemo(
    () => ({ dispatchFromQ, consumeQ }),
    [dispatchFromQ, consumeQ],
  );
};

export default useGeneratorQueue;
