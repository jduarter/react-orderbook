import * as React from 'react';
import { Text } from 'react-native';
import type { StyleProp, TextProps } from 'react-native';

import { useTransition, animated } from '@react-spring/native';
import type { SpringValue } from '@react-spring/native';

const EFFECT_TO_STR_COMPARISON_LENGTH = 3;

type Props = React.PropsWithChildren<{
  style?: Partial<StyleProp<TextProps>>;
  opts:
    | undefined
    | Partial<{
        animation: Partial<{
          shouldPlay: boolean;
          maxFrequencyMs: number;
          backgroundColor: string;
        }>;
      }>;
}>;

const getRgbaFromHex = (hex: string, a = 0, multiplyColorWithFactor = 0.03) => {
  const z = Array.from(hex)
    .slice(1)
    .reduce(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (acc: string[], value, idx, srcArr): string[] =>
        idx % 2 === 0 ? [...acc, srcArr.slice(idx, idx + 2).join('')] : acc,
      [],
    )
    .flat()
    .map((x) =>
      (
        (a !== 1 && multiplyColorWithFactor !== 1
          ? multiplyColorWithFactor
          : 1) * parseInt(x, 16)
      ).toFixed(0),
    );

  const ret = 'rgba(' + z[0] + ',' + z[1] + ',' + z[2] + ',' + a + ')';

  return ret;
};

const postProcessStyle = (
  s: Record<string, SpringValue<any>>,
): StyleProp<any> => {
  return {
    ...s,
    ...(s.fontWeight && s.fontWeight.get
      ? {
          fontWeight: (
            Math.floor(parseFloat(s.fontWeight.get() as string) / 100) * 100
          ).toString(),
        }
      : {}),
  };
};

const compareWithLastValue = ({
  last,
  current,
  startsWithLength = EFFECT_TO_STR_COMPARISON_LENGTH,
}: {
  last: string;
  current: string;
  startsWithLength?: number;
}): boolean =>
  !!(
    !last ||
    (last &&
      current.length >= startsWithLength &&
      last.length >= startsWithLength &&
      last.slice(startsWithLength) !== current.slice(startsWithLength))
  );

interface AnimTrackTimeRef {
  lastModification: number;
  children: string;
}
interface UseLocalTransitionsType {
  backgroundColor?: string;
  children: string;
  maxFrequencyMs: number;
  shouldPlay: boolean;
}

const useLocalTransitions = ({
  backgroundColor,
  children,
  maxFrequencyMs,
  shouldPlay,
}: UseLocalTransitionsType) => {
  const lastC = React.useRef<AnimTrackTimeRef>({
    lastModification: 0,
    children: '',
  });

  const textPartiallyChange = compareWithLastValue({
    last: lastC.current.children,
    current: children,
  });

  const shouldAnimateAgain = React.useMemo(
    () =>
      shouldPlay &&
      textPartiallyChange &&
      (lastC.current.lastModification === 0 ||
        Date.now() - maxFrequencyMs > lastC.current.lastModification),
    [shouldPlay, maxFrequencyMs, textPartiallyChange],
  );

  React.useEffect(() => {
    if (shouldAnimateAgain) {
      lastC.current = {
        lastModification: Date.now(),
        children: children as string,
      };
    } else {
      lastC.current = {
        ...(lastC.current ? lastC.current : {}),
        children: children as string,
      } as AnimTrackTimeRef;
    }
  }, [children, shouldAnimateAgain, textPartiallyChange]);

  const config = React.useMemo(
    () => ({
      delay: 0,
      reset: shouldAnimateAgain,
      expires: true,
      config: {
        duration: 100,
      },
      cancel: !shouldPlay,
      pause: !shouldPlay,
      key: (item: unknown) => item,
      from: { color: '#888', fontWeight: '300' },
      enter: { color: '#fff' },
      update: [
        {
          ...(backgroundColor
            ? {
                backgroundColor: getRgbaFromHex(backgroundColor, 0.3),
                fontWeight: '500',
              }
            : {}),
        },
        {
          ...(backgroundColor
            ? {
                backgroundColor,
              }
            : {}),
        },
      ],
      leave: { display: 'none' },
    }),
    [backgroundColor, shouldPlay, shouldAnimateAgain],
  );

  const transitions = useTransition(
    shouldAnimateAgain,
    shouldPlay ? config : {},
  );

  return [transitions];
};

const DEFAULT_OPTIONS = {
  animation: { shouldPlay: true, maxFrequencyMs: 5000 },
};

const AnimatedTextValue: React.FC<Props> = ({
  children,
  style,
  opts = undefined,
}) => {
  const _opts = {
    animation: {
      ...DEFAULT_OPTIONS.animation,
      ...((opts?.animation && opts.animation) || {}),
    },
  };
  const shouldPlayAnim = _opts.animation.shouldPlay;

  const [transitions] = useLocalTransitions({
    children: children as string,
    maxFrequencyMs: _opts.animation.maxFrequencyMs,
    shouldPlay: shouldPlayAnim,
    ...(_opts.animation.backgroundColor
      ? {
          backgroundColor: _opts.animation.backgroundColor,
        }
      : {}),
  });

  return shouldPlayAnim ? (
    transitions((tStyle) => (
      <animated.Text style={[style, postProcessStyle(tStyle)]}>
        {children}
      </animated.Text>
    ))
  ) : (
    <Text style={style as StyleProp<any>}>{children}</Text>
  );
};

const MemoizedAnimatedTextValue = React.memo(AnimatedTextValue);

export default MemoizedAnimatedTextValue;
