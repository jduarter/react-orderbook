/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                               *
 *                    | react-native-orderbook |                 *
 *                                                               *
 *  License |  MIT General Public License                        *
 *  Author  |  Jorge Duarte Rodríguez <info@malagadev.com>       *
 *                                                               *
 *                            (c) 2021                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
import * as React from 'react';
import type { StyleProp, TextProps } from 'react-native';
import { useSpring, animated } from '@react-spring/native';

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

  config: { duration: 200, mass: 1, tension: 180, friction: 120, clamp: true },
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

const AnimatedTextValue: React.FC<
  React.PropsWithChildren<{
    highlightingTextColor: string;
    textColor: string;
    style?: Partial<StyleProp<TextProps>>;
  }>
> = ({ highlightingTextColor, textColor, children, style }) => {
  const [styles, api] = useSpring(() =>
    DEFAULT_ANIMATION_OPTIONS({ highlightingTextColor, textColor }),
  );

  React.useEffect(() => {
    return () => {
      api.stop();
    };
  }, []);

  return (
    <animated.Text
      style={
        (style
          ? {
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
