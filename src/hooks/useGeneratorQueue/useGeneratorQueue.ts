import { useCallback, useRef } from 'react';

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
  const consumeQ = function* () {
    yield ref.current.shift();
  };
  return { dispatchFromQ, consumeQ };
};

export default useGeneratorQueue;
