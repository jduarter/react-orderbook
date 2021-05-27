import React, { useMemo, useCallback, useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

import { useDebounceCallback } from '@react-hook/debounce';

import { default as OrderbookSection } from './components/OrderbookSection';

import type { OrderbookOrdersSortedObject } from './types';
import { orderAndLimit, getGroupByFactor } from './utils';
import { useOrderbookController } from './hooks';

const ENABLE_TWO_WAY_REDUCER_ACTIONS = false;

const GroupButton: FC<{
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}> = ({ title, onPress, style }) => {
  return (
    <TouchableOpacity onPress={onPress} style={style}>
      <Text style={styles.groupButtonDefaultStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

const calculateSpread = (high: number, low: number) => {
  if (!low || !high) {
    return 0;
  }

  return -1 * (high / low - 1) * 100;
};

const Spread: FC<{ high: number; low: number }> = ({ high, low }) => {
  //console.log('Spread: ', { high, low });
  const [spread, setSpread] = useState(() =>
    calculateSpread(high, low).toFixed(1),
  );
  const updateSpread = useCallback(() => {
    const s = calculateSpread(high, low).toFixed(1);
    setSpread(s);
  }, [high, low, setSpread]);

  const _fn = useDebounceCallback(updateSpread, 200);

  useEffect(() => {
    _fn();
  }, [high, low, _fn]);

  return (
    <Text style={{ padding: 10, marginHorizontal: 20, color: '#555' }}>
      {high - low} Spread: {spread + ' %'}
    </Text>
  );
};

const SpreadWidget: FC<{
  bids: OrderbookOrdersSortedObject;
  asks: OrderbookOrdersSortedObject;
}> = ({ bids, asks }) => {
  console.log('SpreadWidget');
  const spreadCalcIsReady =
    typeof bids[0] !== 'undefined' && typeof asks[0] !== 'undefined';

  const a = useMemo(
    () =>
      spreadCalcIsReady &&
      Object.entries(bids).slice(Object.entries(bids).length - 1)[0],
    [spreadCalcIsReady, bids],
  );

  const b = useMemo(
    () => spreadCalcIsReady && Object.entries(asks)[0],
    [spreadCalcIsReady, asks],
  );

  if (!a || !b) {
    return null;
  }

  console.log({ a, b });

  return <Spread high={parseFloat(a[0]) / 100} low={parseFloat(b[0]) / 100} />;
};

const OrderbookComponent: FC = () => {
  const { orderBook, orderBookDispatch, connectionStatus } =
    useOrderbookController({
      disableTwoWayProcessing: !ENABLE_TWO_WAY_REDUCER_ACTIONS,
      subscribeToProductIds: ['PI_XBTUSD'],
      initialGroupBy: 100,
    });

  const getGroupByButton = useCallback(
    (v: -1 | 1) => () =>
      getGroupByFactor(orderBook.groupBy, v) &&
      orderBookDispatch({
        type: 'SET_GROUP_BY',
        payload: {
          value:
            v === -1
              ? orderBook.groupBy / getGroupByFactor(orderBook.groupBy, v)
              : orderBook.groupBy * getGroupByFactor(orderBook.groupBy, v),
        },
      }),
    [orderBook.groupBy],
  );

  const groupByButtons = useMemo(
    () => (
      <View style={{ padding: 4, flex: 1, flexDirection: 'row' }}>
        <GroupButton
          title={'-'}
          style={{ flex: 1 }}
          onPress={getGroupByButton(-1)}
        />
        <GroupButton
          title={'+'}
          style={{ flex: 1 }}
          onPress={getGroupByButton(1)}
        />
      </View>
    ),
    [getGroupByButton],
  );

  if (!orderBook || !orderBook.grouped) {
    return <Text>Loading</Text>;
  }

  const asksData = orderAndLimit(
    orderBook.groupBy === 1 ? orderBook.asks : orderBook.grouped.asks,
    8,
    'desc',
  );
  const bidsData = orderAndLimit(
    orderBook.groupBy === 1 ? orderBook.bids : orderBook.grouped.bids,
    8,
    'desc',
  );

  const spreadCalcIsReady = false; // orderBook.asks.length > 0 && orderBook.bids.length > 0;

  return (
    <View style={{ flex: 1 }}>
      {connectionStatus.websocket.connected === false &&
        (connectionStatus.connectedToInternet === true ? (
          <View style={styles.genericConnectionProblemWrapper}>
            <Text>Problems with Websocket service</Text>
          </View>
        ) : (
          <View style={styles.genericConnectionProblemWrapper}>
            <Text>Problems with inteernet</Text>
          </View>
        ))}

      <View style={styles.orderBookSubWrapper}>
        <View
          style={{
            height: '45%',
            overflow: 'hidden',
            justifyContent: 'flex-end',
          }}>
          {asksData.length > 0 ? (
            <OrderbookSection
              keyPrefix={'a_'}
              backgroundColor={'#7c0a02'}
              normalizedData={asksData}
              totalOrderBy={'asc'}
            />
          ) : (
            <Text>Loading</Text>
          )}
        </View>
        <View style={styles.orderBookSummaryWrap}>
          {spreadCalcIsReady && (
            <SpreadWidget bids={orderBook.bids} asks={orderBook.asks} />
          )}
          <Text style={{ flex: 1, flexShrink: 0 }}>
            Group: {orderBook.groupBy}
          </Text>
          {groupByButtons}
        </View>
        <View style={{ height: '45%', overflow: 'hidden' }}>
          {bidsData.length > 0 ? (
            <OrderbookSection
              keyPrefix={'b_'}
              backgroundColor={'#043927'}
              normalizedData={bidsData}
              totalOrderBy={'desc'}
            />
          ) : (
            <Text>Loading</Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default OrderbookComponent;

const styles = StyleSheet.create({
  genericConnectionProblemWrapper: {
    backgroundColor: 'red',
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 10,
  },
  orderBookSummaryWrap: {
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '10%',
    padding: '2.5%',
  },
  orderBookSubWrapper: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    alignContent: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  groupButtonDefaultStyle: { color: '#666', fontSize: 32 },
});
