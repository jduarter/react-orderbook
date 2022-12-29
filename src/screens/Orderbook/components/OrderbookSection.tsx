import * as React from 'react';
import { View } from 'react-native';
import { useTransition, animated, config } from '@react-spring/native';

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
  normalizedData: [string, Decimal, Decimal][];
  textColor?: string;
  rowHeight?: number;
}> = ({ backgroundColor, normalizedData, rowHeight = 42 }) => {
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
      item: [string, Decimal, Decimal],
    ) => {
      const shouldStopChildrenAnimation =
        style.height?.get && style.height.get() !== Math.floor(rowHeight);

      return (
        <animated.View key={item[0]} style={style}>
          <OrderbookRow
            price={item[0]}
            val={item[1]}
            total={item[2]}
            backgroundColor={backgroundColor}
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

const OrderbookSection: React.FC<{
  backgroundColor: string;
  normalizedData: [string, Decimal, Decimal][];
  textColor?: string;
  rowHeight?: number;
}> = ({ backgroundColor, normalizedData, rowHeight = 42 }) => {
  return (
    <View>
      {normalizedData.map((dataItem) => (
        <View
          key={dataItem[0]}
          style={{
            backgroundColor,
            /*animation*/ rowHeight: Math.floor(rowHeight),
          }}>
          <OrderbookRow
            price={dataItem[0]}
            val={dataItem[1]}
            total={dataItem[2]}
            backgroundColor={backgroundColor}
            isLeaving={false}
          />
        </View>
      ))}
    </View>
  );
};

const MemoizedOrderbookSection = React.memo(AnimatedOrderbookSection);

export default MemoizedOrderbookSection;
