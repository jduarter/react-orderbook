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
    // console.log('[dispatch received] Current items: ', ref.current.length);
  }, []);

  const consumeQ = useCallback(function* (limit = 1) {
    if (ref.current.length === 0) {
      return;
    }

    if (limit === 1) {
      yield [ref.current.shift()];
    } else if (limit === null) {
      yield ref.current.splice(-ref.current.length).reverse();
    }
  }, []);

  return useMemo(() => ({ dispatchToQ, consumeQ }), [dispatchToQ, consumeQ]);
};

export default useGeneratorQueue;
