import * as React from 'react';
import type { StyleProp, TextProps } from 'react-native';
import { useSpring, animated } from '@react-spring/native';

const ENABLE_ANIMATIONS = true;

const DEFAULT_ANIMATION_OPTIONS = ({
  textColor,
  highlightingTextColor,
}: {
  highlightingTextColor: string;
  textColor: string;
}) => ({
  from: {
    fontSize: 16,
    color: textColor,
  },

  config: {
    duration: 200,
    mass: 1,
    tension: 180,
    friction: 120,
    clamp: true,
  },
  to: [
    { color: highlightingTextColor },
    {
      color: '#666',
    },
    { color: highlightingTextColor },

    { color: textColor },
  ],
  leave: { color: '#000' },
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
}) => {
  const [styles, api] = ENABLE_ANIMATIONS
    ? useSpring(() =>
        DEFAULT_ANIMATION_OPTIONS({ highlightingTextColor, textColor }),
      )
    : [undefined, undefined];

  React.useEffect(() => {
    return () => {
      ENABLE_ANIMATIONS && api?.stop();
    };
  }, []);

  return (
    <animated.Text
      style={
        (style
          ? {
              ...(ENABLE_ANIMATIONS ? {} : { color: textColor }),
              ...style,
              ...styles,
            }
          : styles) as StyleProp<TextProps>
      }>
      {children}
    </animated.Text>
  );
};

const MemoizedAnimatedTextValue = React.memo(AnimatedTextValue);

export default MemoizedAnimatedTextValue;
