import * as React from 'react';
import { Text } from 'react-native';
import type { StyleProp, TextProps } from 'react-native';

import { useTransition, animated } from '@react-spring/native';
import type { SpringValue } from '@react-spring/native';

const EFFECT_TO_STR_COMPARISON_LENGTH = 2;

type Props = React.PropsWithChildren<{
  backgroundColor: string;
  style?: Partial<StyleProp<TextProps>>;
  isLeaving: boolean;
}>;

const getRgbaFromHex = (hex: string, a = 0, multiplyColorWithFactor = 0.03) => {
  const z = Array.from(hex)
    .slice(1)
    .reduce(
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

const ensure0 = (v: undefined | false | number): number => (!v ? 0 : v);

const AnimatedTextValue: React.FC<Props> = ({
  children,
  isLeaving,
  style,
  backgroundColor,
  disableAnimation = false,
}) => {
  const shouldPlayAnim = !disableAnimation && !isLeaving;
  // console.log({ shouldPlayAnim, disableAnimation, isLeaving });
  const currentPrintedValue = children as string;
  const lastC = React.useRef<{ lastModification: number; children: string }>();

  const textPartiallyChange =
    shouldPlayAnim &&
    (!lastC.current ||
      (lastC.current &&
        currentPrintedValue.length >= EFFECT_TO_STR_COMPARISON_LENGTH &&
        lastC.current.children.length >= EFFECT_TO_STR_COMPARISON_LENGTH &&
        lastC.current.children.slice(EFFECT_TO_STR_COMPARISON_LENGTH) !==
          currentPrintedValue.slice(EFFECT_TO_STR_COMPARISON_LENGTH)));

  const shouldAnimateAgain = React.useMemo(
    () =>
      shouldPlayAnim &&
      textPartiallyChange &&
      (ensure0(lastC.current?.lastModification) === 0 ||
        Date.now() - 5000 > ensure0(lastC.current?.lastModification)),
    [shouldPlayAnim, textPartiallyChange],
  );

  React.useEffect(() => {
    if (shouldAnimateAgain) {
      lastC.current = {
        lastModification: Date.now(),
        children: children as string,
      };
    } else {
      lastC.current = {
        ...(lastC.current ? lastC.current : { lastModification: Date.now() }),
        children: children as string,
      };
    }
  }, [children, shouldAnimateAgain, textPartiallyChange]);

  const transitionConfig = React.useMemo(
    () => ({
      //duration: 150,
      delay: 0,
      reset: shouldAnimateAgain,
      expires: true,
      config: {
        mass: 0.1,
        tension: 360,
        friction: 10,
        precision: 0.4,
        velocity: -1,
      },
      cancel: !shouldPlayAnim,
      pause: !shouldPlayAnim,
      key: (item) => item,
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
    [backgroundColor, shouldPlayAnim, shouldAnimateAgain],
  );

  const transitions = useTransition(
    shouldAnimateAgain,
    shouldPlayAnim ? transitionConfig : {},
  );

  return shouldPlayAnim ? (
    transitions((tStyle) => (
      <animated.Text style={[style, postProcessStyle(tStyle)]}>
        {children}
      </animated.Text>
    ))
  ) : (
    <Text style={style}>{children}</Text>
  );
};

const MemoizedAnimatedTextValue = React.memo(AnimatedTextValue);

export default MemoizedAnimatedTextValue;
