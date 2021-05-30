import { useCallback, useRef, useMemo } from 'react';

import type { UseGeneratorQueueReturn } from './types';

const useGeneratorQueue = <T>(
  initialState: T[] = [],
): UseGeneratorQueueReturn<T> => {
  const ref = useRef<T[]>(initialState);
  const dispatchToQ = useCallback((payload) => {
    for (const item of payload) {
      ref.current.push(item);
    }
  }, []);

  const consumeQ = useCallback(function* () {
    yield ref.current.shift();
  }, []);

  return useMemo(() => ({ dispatchToQ, consumeQ }), [dispatchToQ, consumeQ]);
};

export default useGeneratorQueue;
