import * as React from 'react';
import { View } from 'react-native';
import { useTransition, animated, config } from '@react-spring/native';

import { default as OrderbookRow } from './OrderbookRow';

const DEFAULT_TRANSITION_OPTIONS = ({
  backgroundColor = '#fff',
  rowHeight,
}: {
  rowHeight: number;
  backgroundColor: string;
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
  groupBy: number,
): ProcessedNormalizedData =>
  normalizedData.map<ProcessedNormalizedRecord>((e, index) => {
    const k = keyPrefix + '_' + e[0];
    const t = getTotalForRow(normalizedData, index, totalOrderBy);

    const returnValue: ProcessedNormalizedRecord = [
      (
        (totalOrderBy === 'asc' ? groupBy * Math.pow(10, 2) : 0) + e[0]
      ).toString(),
      e[1],
      k,
      t,
    ];
    return returnValue;
  });

const DISABLE_ANIMATIONS = false;

const OrderbookSection: React.FC<{
  backgroundColor: string;
  normalizedData: NormalizedData;
  keyPrefix: string;
  groupBy: number;
  totalOrderBy: 'asc' | 'desc';
  textColor?: string;
  rowHeight?: number;
}> = ({
  backgroundColor,
  normalizedData,
  groupBy,
  keyPrefix,
  totalOrderBy,
  rowHeight = 42,
}) => {
  const data = React.useMemo(
    () =>
      processNormalizedData(normalizedData, keyPrefix, totalOrderBy, groupBy),
    [keyPrefix, normalizedData, totalOrderBy],
  );
  const transData =
    !DISABLE_ANIMATIONS &&
    React.useMemo(
      () =>
        DEFAULT_TRANSITION_OPTIONS({
          backgroundColor,
          rowHeight: Math.floor(rowHeight),
        }),
      [backgroundColor, rowHeight],
    );

  const transitions = !DISABLE_ANIMATIONS && useTransition(data, transData);

  React.useEffect(() => {
    return () => {
      console.log('[OrderbookSection] destroys');
    };
  }, []);

  const cb =
    !DISABLE_ANIMATIONS &&
    React.useCallback(
      (style, item) => {
        const shouldStopChildrenAnimation =
          style.height?.get && style.height.get() !== Math.floor(rowHeight);

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

  const mapper = !DISABLE_ANIMATIONS
    ? transitions
    : (_data) =>
        _data.map((item) => {
          return (
            <OrderbookRow
              key={item[2]}
              price={p}
              val={item[1]}
              total={item[3]}
              backgroundColor={backgroundColor}
              isLeaving={true}
            />
          );
        });

  return React.useMemo(
    () => (
      <View style={{ backgroundColor }}>
        {mapper(!DISABLE_ANIMATIONS ? cb : data)}
      </View>
    ),
    [backgroundColor, data, mapper, cb],
  );
};

const MemoizedOrderbookSection = React.memo(OrderbookSection);

export default MemoizedOrderbookSection;
