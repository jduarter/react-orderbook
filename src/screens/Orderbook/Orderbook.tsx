/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                               *
 *                    | react-native-orderbook |                 *
 *                                                               *
 *  License |  MIT General Public License                        *
 *  Author  |  Jorge Duarte Rodríguez <info@malagadev.com>       *
 *                                                               *
 *                            (c) 2021                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React from 'react';
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
import {
  useOrderbookConnection,
  useOrderbookReducer,
  useOrderbookProcessing,
} from './hooks';

const GroupButton: React.FC<{
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

const Spread = ({ high, low }: { high: number; low: number }) => {
  //console.log('Spread: ', { high, low });
  const [spread, setSpread] = React.useState(() =>
    calculateSpread(high, low).toFixed(1),
  );
  const updateSpread = React.useCallback(() => {
    const s = calculateSpread(high, low).toFixed(1);
    setSpread(s);
  }, [high, low, setSpread]);

  const function_ = useDebounceCallback(updateSpread, 200);

  React.useEffect(() => {
    function_();
  }, [high, low, function_]);

  return (
    <Text style={{ padding: 10, marginHorizontal: 20, color: '#555' }}>
      {high - low} Spread: {spread + ' %'}
    </Text>
  );
};

const SpreadWidget = ({
  bids,
  asks,
}: {
  bids: OrderbookOrdersSortedObject;
  asks: OrderbookOrdersSortedObject;
}) => {
  const spreadCalcIsReady =
    typeof bids[0] !== 'undefined' && typeof asks[0] !== 'undefined';

  const a = React.useMemo(
    () =>
      spreadCalcIsReady &&
      Object.entries(bids).slice(Object.entries(bids).length - 1)[0],
    [spreadCalcIsReady, bids],
  );

  const b = React.useMemo(
    () => spreadCalcIsReady && Object.entries(asks)[0],
    [spreadCalcIsReady, asks],
  );

  if (!a || !b) {
    return null;
  }

  console.log({ a, b });

  return (
    <Spread
      high={Number.parseFloat(a[0]) / 100}
      low={Number.parseFloat(b[0]) / 100}
    />
  );
};

const OrderbookComponent: FC = () => {
  const [orderBook, orderBookDispatch] = useOrderbookReducer();
  const { connectionStatus } = useOrderbookConnection({ orderBookDispatch });

  useOrderbookProcessing({
    onProcessCycle: React.useCallback(() => {
      orderBookDispatch({ type: 'CALCULATE_GROUPED', payload: {} });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
    orderBook,
  });

  const getGroupByButton = React.useCallback(
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

  const groupByButtons = React.useMemo(
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

  const spreadCalcIsReady =
    orderBook.asks.length > 0 && orderBook.bids.length > 0;

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
