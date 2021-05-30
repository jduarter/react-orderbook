import * as React from 'react';
import { View } from 'react-native';
import { useTransition, animated } from '@react-spring/native';

import { default as OrderbookRow } from './OrderbookRow';

const DEFAULT_TRANSITION_OPTIONS = ({
  backgroundColor = '#fff',
  textColor = '#000',
}) => ({
  keys: (item: any) => item[2],
  from: {
    backgroundColor: textColor,
    left: 400,
    position: 'absolute',
    opacity: 0.5,
  },
  enter: [
    { left: 0, position: 'relative' },
    {
      height: -1,
      opacity: 1,
      backgroundColor,
    },
  ],
  leave: [
    { backgroundColor: '#000' },
    { height: 0 },
    { backgroundColor: textColor },
    { position: 'relative', left: 0, opacity: 1, height: -1 },
  ],
  delay: 25,
  expires: true,
  immediate: true,
  reset: false,
  config: { duration: 200, mass: 1, tension: 180, friction: 12 },
});

type NormalizedRecord = [number, number];
type NormalizedData = NormalizedRecord[];

const getTotalForRow = (
  rows: NormalizedData,
  index: number,
  orderBy: 'asc' | 'desc',
): number =>
  rows.reduce(
    (acc: number, current, ridx: number) =>
      acc +
      ((orderBy === 'asc' ? ridx >= index : index >= ridx) ? current[1] : 0),
    0,
  );

type ProcessedNormalizedRecord = [...NormalizedRecord, string, number];
type ProcessedNormalizedData = ProcessedNormalizedRecord[];

const processNormalizedData = (
  normalizedData: NormalizedData,
  keyPrefix: string,
  totalOrderBy: 'asc' | 'desc',
): ProcessedNormalizedData =>
  normalizedData.map<ProcessedNormalizedRecord>((e, index) => {
    const k = keyPrefix + '_' + e[0];
    const t = getTotalForRow(normalizedData, index, totalOrderBy);
    const returnValue: ProcessedNormalizedRecord = [e[0], e[1], k, t];
    return returnValue;
  });

const OrderbookSection: React.FC<{
  backgroundColor: string;
  normalizedData: NormalizedData;
  keyPrefix: string;
  totalOrderBy: 'asc' | 'desc';
  textColor?: string;
  rowHeight?: number;
}> = ({
  backgroundColor,
  normalizedData,
  keyPrefix,
  totalOrderBy,
  textColor = '#c2c2c2',
  rowHeight = 42,
}) => {
  const data = processNormalizedData(normalizedData, keyPrefix, totalOrderBy);
  const transitions = useTransition(
    data,
    DEFAULT_TRANSITION_OPTIONS({ backgroundColor, textColor }),
  );

  const cb = React.useCallback(
    (style, item) => {
      return (
        <animated.View
          key={item[2]}
          style={
            style.height
              ? {
                  ...style,
                  height:
                    style.height.get() === -1
                      ? style.height.set(rowHeight)
                      : style.height,
                }
              : style
          }>
          <OrderbookRow
            price={item[0].toString()}
            textColor={textColor}
            val={item[1]}
            total={item[3]}
            backgroundColor={backgroundColor}
          />
        </animated.View>
      );
    },
    [rowHeight, textColor],
  );

  return React.useMemo(
    () => <View style={{ backgroundColor }}>{transitions(cb)}</View>,
    [backgroundColor, transitions, cb],
  );
};

const MemoizedOrderbookSection = React.memo(OrderbookSection);

export default MemoizedOrderbookSection;
