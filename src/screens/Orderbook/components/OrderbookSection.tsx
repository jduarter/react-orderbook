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
import { View } from 'react-native';
import { useTransition, animated } from '@react-spring/native';

import { useThrottleCallback } from '@react-hook/throttle';

import { default as OrderbookRow } from './OrderbookRow';

const DEFAULT_TRANSITION_OPTIONS = ({ backgroundColor = '#fff', textColor = '#000' }) => ({
  keys: (item: any) => item[2],
  from: {
    backgroundColor: textColor,
    // position: 'absolute',
    left: 400,
    position: 'absolute',
    opacity: 0.5,
  },
  enter: [
    { left: 0, position: 'relative' },
    {
      opacity: 1,
      backgroundColor,
    },
  ],
  leave: [{ backgroundColor: '#000' }, { height: 0 }, { backgroundColor: textColor }],
  delay: 25,
  expires: true,
  immediate: true,
  reset: false,
  config: { duration: 200, mass: 1, tension: 180, friction: 12 },
});

type NormalizedRecord = [number, number];
type NormalizedData = NormalizedRecord[];

const getTotalForRow = (rows: NormalizedData, index: number, orderBy: 'asc' | 'desc'): number =>
  rows.reduce(
    (accumulator: number, current, ridx: number) =>
      accumulator + ((orderBy === 'asc' ? ridx >= index : index >= ridx) ? current[1] : 0),
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

const getSignatureForData = (data: ProcessedNormalizedData): string =>
  JSON.stringify(data.slice(0, 50)); /* {
  return JSON.stringify(data); //data.map((d) => Object.keys(d).join('.')).join(':');
  return (
    data.length + '#' + (data.length > 0 ? data[0].join(',') + data[data.length - 1].join(',') : '')
  ); //JSON.stringify(data); //data.map((d) => Object.keys(d).join('.')).join(':');
};*/

const OrderbookSection: React.FC<{
  backgroundColor: string;
  normalizedData: NormalizedData;
  keyPrefix: string;
  totalOrderBy: 'asc' | 'desc';
  textColor?: string;
}> = ({ backgroundColor, normalizedData, keyPrefix, totalOrderBy, textColor = '#c2c2c2' }) => {
  const [dataState, setDataState] = React.useState<{
    state: ProcessedNormalizedData;
    signature: string | null;
  }>(() => {
    const d = processNormalizedData(normalizedData, keyPrefix, totalOrderBy);
    return { state: d, signature: d ? getSignatureForData(d) : null };
  });

  /* console.log(
    'OrderbookSection: ',
    normalizedData.map((x) => x[0] / 100),
    //  dataState,
  ); */

  const updateDataState = React.useCallback(() => {
    const data = processNormalizedData(normalizedData, keyPrefix, totalOrderBy);
    const dataSignature = getSignatureForData(data);
    if (dataSignature !== dataState.signature) {
      setDataState((st) => ({ ...st, state: data, signature: dataSignature }));
    }
  }, [normalizedData, keyPrefix, dataState, setDataState, totalOrderBy]);

  const tFunction = useThrottleCallback(() => updateDataState(), 1000);

  React.useEffect(() => {
    tFunction();
  }, [tFunction, normalizedData]);

  const transitions = useTransition(
    dataState.state,
    DEFAULT_TRANSITION_OPTIONS({ backgroundColor, textColor }),
  );

  const TC = React.useCallback(
    (styles, item) => (
      <animated.View style={styles}>
        <OrderbookRow price={item[0]} textColor={textColor} val={item[1]} total={item[3]} />
      </animated.View>
    ),
    [textColor],
  );

  return <View style={{ backgroundColor }}>{transitions(TC)}</View>;
};

const MemoizedOrderbookSection = React.memo(OrderbookSection);

export default MemoizedOrderbookSection;
