import * as React from 'react';
import type { StyleProp, TextProps } from 'react-native';
import { useSpring, animated } from '@react-spring/native';

const getRgbaFromHex = (hex: string, a = 0) => {
  const z = Array.from(hex)
    .slice(1)
    .reduce(
      (result, value, index, sourceArray) =>
        index % 2 === 0
          ? [...result, sourceArray.slice(index, index + 2).join('')]
          : result,
      [],
    )
    .flat()
    .map((x) => parseInt((a != 1 ? 0.03 : 1) * parseInt(x, 16)));

  const ret = 'rgba(' + z[0] + ',' + z[1] + ',' + z[2] + ',' + a + ')';

  return ret;
};

const DEFAULT_ANIMATION_OPTIONS = ({
  textColor,
  highlightingTextColor,
  backgroundColor,
}: {
  highlightingTextColor: string;
  textColor: string;
}) => ({
  from: {
    fontWeight: '600',
    color: textColor,
    ...(backgroundColor
      ? {
          backgroundColor: getRgbaFromHex(backgroundColor, 1),
        }
      : {}),
  },
  config: {
    duration: 250,
    mass: 1,
    tension: 180,
    friction: 12,
  },
  to: [
    {
      ...(backgroundColor
        ? {
            backgroundColor: getRgbaFromHex(backgroundColor, 0.2),
          }
        : {}),
      fontWeight: '500',
      color: highlightingTextColor,
    },
    {
      color: '#666',
    },
    { fontWeight: '300', color: highlightingTextColor },
    { color: textColor, backgroundColor },
  ],
  leave: { color: '#000', fontWeight: '300' },
});

type Props = React.PropsWithChildren<{
  highlightingTextColor: string;
  textColor: string;
  style?: Partial<StyleProp<TextProps>>;
}>;

const AnimatedTextValue: React.FC<Props> = ({
  highlightingTextColor,
  textColor,
  children,
  style,
  backgroundColor,
}) => {
  const [styles, api] = useSpring(() =>
    DEFAULT_ANIMATION_OPTIONS({
      highlightingTextColor,
      textColor,
      backgroundColor,
    }),
  );

  React.useEffect(() => {
    return () => {
      api?.stop();
    };
  }, [api]);

  const _s = {
    ...(style
      ? {
          ...style,
          ...styles,
        }
      : styles),
    paddingHorizontal: 0,
    paddingBottom: 2,
  };

  if (_s.fontWeight) {
    _s.fontWeight = (
      parseInt(parseFloat(_s.fontWeight.get()) / 100) * 100
    ).toString();
  }

  return (
    <animated.Text style={_s as StyleProp<TextProps>}>{children}</animated.Text>
  );
};

const MemoizedAnimatedTextValue = React.memo(AnimatedTextValue);

export default MemoizedAnimatedTextValue;
