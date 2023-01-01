import * as React from 'react';
import { View } from 'react-native';
import { useTransition, animated, config } from '@react-spring/native';

import type { NormalizedData } from '../types';

import type { Decimal } from 'decimal.js';

import { default as OrderbookRow } from './OrderbookRow';

const DEFAULT_TRANSITION_OPTIONS = ({
  backgroundColor = '#fff',
  rowHeight,
}: {
  rowHeight: number;
  backgroundColor: string;
}) => ({
  keys: (item: any) => item[0],
  from: {
    backgroundColor: '#fff',
    height: 0,
  },
  enter: [{ backgroundColor: '#fff' }, { backgroundColor, height: rowHeight }],
  leave: [{ height: 0, backgroundColor: '#000' }],
  expires: true,
  reset: false,
  config: { ...config.wobbly },
});

const AnimatedOrderbookSection: React.FC<{
  backgroundColor: string;
  backgroundColorForWeights: string;
  normalizedData: NormalizedData;
  textColor?: string;
  rowHeight?: number;
}> = ({
  backgroundColor,
  backgroundColorForWeights,
  normalizedData,
  rowHeight = 42,
}) => {
  const transData = React.useMemo(
    () =>
      DEFAULT_TRANSITION_OPTIONS({
        backgroundColor,
        rowHeight: Math.floor(rowHeight),
      }),
    [backgroundColor, rowHeight],
  );

  const transitions = useTransition(normalizedData, transData);

  const cb = React.useCallback(
    (
      style: { height: any /* @todo: type */ },
      item: [string, Decimal, Decimal, number],
    ) => {
      const shouldStopChildrenAnimation =
        style.height?.get && style.height.get() !== Math.floor(rowHeight);

      return (
        <animated.View key={item[0]} style={style}>
          <OrderbookRow
            price={item[0]}
            val={item[1]}
            total={item[2]}
            relSizeWeight={item[3]}
            backgroundColor={backgroundColor}
            backgroundColorForWeights={backgroundColorForWeights}
            isLeaving={shouldStopChildrenAnimation}
          />
        </animated.View>
      );
    },
    [rowHeight, backgroundColor],
  );

  return React.useMemo(
    () => <View style={{ backgroundColor }}>{transitions(cb)}</View>,
    [backgroundColor, transitions, cb],
  );
};

const MemoizedOrderbookSection = React.memo(AnimatedOrderbookSection);

export default MemoizedOrderbookSection;
