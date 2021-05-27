import * as React from 'react';
import { View } from 'react-native';
import { useTransition, animated } from '@react-spring/native';

//import { useThrottleCallback } from '@react-hook/throttle';

import { default as OrderbookRow } from './OrderbookRow';

const DEFAULT_TRANSITION_OPTIONS = ({
    backgroundColor = '#fff',
    textColor = '#000',
}) => ({
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
    leave: [
        { backgroundColor: '#000' },
        { height: 0 },
        { backgroundColor: textColor },
    ],
    delay: 25,
    expires: true,
    immediate: true,
    reset: false,
    config: { duration: 200, mass: 1, tension: 180, friction: 12 },
});

type NormalizedRecord = [number, number];
type NormalizedData = NormalizedRecord[];
const ENABLE_ANIMATIONS = false;
const getTotalForRow = (
    rows: NormalizedData,
    index: number,
    orderBy: 'asc' | 'desc',
): number =>
    rows.reduce(
        (acc: number, current, ridx: number) =>
            acc +
            ((orderBy === 'asc' ? ridx >= index : index >= ridx)
                ? current[1]
                : 0),
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

const ChildComp = ({
    item: [price, size, _k, total],
    textColor,
}: {
    item: ProcessedNormalizedRecord;
    textColor: string;
}) => {
    return (
        <OrderbookRow
            price={price}
            textColor={textColor}
            val={size}
            total={total}
        />
    );
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = (): void => {};

const OrderbookSection: React.FC<{
    backgroundColor: string;
    normalizedData: NormalizedData;
    keyPrefix: string;
    totalOrderBy: 'asc' | 'desc';
    textColor?: string;
}> = ({
    backgroundColor,
    normalizedData,
    keyPrefix,
    totalOrderBy,
    textColor = '#c2c2c2',
}) => {
    const data = processNormalizedData(normalizedData, keyPrefix, totalOrderBy);
    const transitions = ENABLE_ANIMATIONS
        ? // eslint-disable-next-line react-hooks/rules-of-hooks
          useTransition(
              data,
              DEFAULT_TRANSITION_OPTIONS({ backgroundColor, textColor }),
          )
        : noop;

    const TC = React.useCallback(
        (styles, item) =>
            ENABLE_ANIMATIONS && (
                <animated.View style={styles}>
                    {ChildComp({ textColor, item })}
                </animated.View>
            ),
        [textColor],
    );

    return React.useMemo(
        () => (
            <View style={{ backgroundColor }}>
                {ENABLE_ANIMATIONS
                    ? (transitions(TC) as React.ReactNode)
                    : data.map((item) => (
                          <ChildComp
                              key={item[2]}
                              item={item}
                              textColor={textColor}
                          />
                      ))}
            </View>
        ),
        [textColor, backgroundColor, transitions, TC, data],
    );
};

const MemoizedOrderbookSection = React.memo(OrderbookSection);

export default MemoizedOrderbookSection;
