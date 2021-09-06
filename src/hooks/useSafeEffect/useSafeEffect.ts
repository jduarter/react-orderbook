import { useRef, useMemo, useEffect, useCallback } from 'react';
import type { DependencyList } from 'react';

import type { UseSafeEffectEffect, IsMountedFunctionType } from './types';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const voidFn = (): void => {};

const useSafeEffect = (
  effect: UseSafeEffectEffect,
  deps?: DependencyList,
): { isMounted: IsMountedFunctionType } => {
  const ref = useRef<{
    mounted: boolean;
    effectFn: null | UseSafeEffectEffect;
  }>({ mounted: false, effectFn: null });

  useEffect(() => {
    ref.current.mounted = true;
    return () => {
      ref.current.effectFn = voidFn;
      ref.current.mounted = false;
    };
  }, []);

  useEffect(() => {
    ref.current.effectFn = effect;
  }, [effect]);

  const getLastEffectVersion = useCallback(() => {
    return ref.current.effectFn || voidFn;
  }, []);

  const isMounted = useCallback(() => ref.current.mounted, []);

  useEffect(
    () =>
      ref.current.mounted === true
        ? getLastEffectVersion()(isMounted)
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...(deps || []), getLastEffectVersion, isMounted],
  );

  return useMemo<{ isMounted: IsMountedFunctionType }>(
    () => ({ isMounted }),
    [isMounted],
  );
};

export default useSafeEffect;
