import * as React from 'react';
import { View } from 'react-native';
import { useTransition, animated, config } from '@react-spring/native';

import { default as OrderbookRow } from './OrderbookRow';

const DEFAULT_TRANSITION_OPTIONS = ({
  backgroundColor = '#fff',
  rowHeight: number,
}) => ({
  keys: (item: any) => item[2],
  from: {
    backgroundColor: '#fff',
    height: 0,
  },
  enter: [{ backgroundColor: '#fff' }, { backgroundColor, height: rowHeight }],
  leave: [{ height: 0, backgroundColor: '#000' }], //[{ position: 'absolute', height: 0 }, { display: 'none' }],
  expires: true,
  reset: false,
  config: { ...config.wobbly },
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
  rowHeight = 42,
}) => {
  const data = React.useMemo(
    () => processNormalizedData(normalizedData, keyPrefix, totalOrderBy),
    [keyPrefix, normalizedData, totalOrderBy],
  );
  const transData = React.useMemo(
    () =>
      DEFAULT_TRANSITION_OPTIONS({
        backgroundColor,
        rowHeight: Math.floor(rowHeight),
      }),
    [backgroundColor, rowHeight],
  );

  const transitions = useTransition(data, transData);

  React.useEffect(() => {
    return () => {
      console.log('[OrderbookSection] destroys');
    };
  }, []);

  const cb = React.useCallback(
    (style, item) => {
      const shouldStopChildrenAnimation =
        style.height?.get && style.height.get() !== rowHeight;

      return (
        <animated.View key={item[2]} style={style}>
          <OrderbookRow
            price={item[0].toString()}
            val={item[1]}
            total={item[3]}
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

const MemoizedOrderbookSection = React.memo(OrderbookSection);

export default MemoizedOrderbookSection;
