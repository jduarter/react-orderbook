import React, { useMemo, useCallback, useState, useEffect } from 'react';
import type { FC } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

import { useDebounceCallback } from '@react-hook/debounce';

import { default as OrderbookSection } from './components/OrderbookSection';

import GroupByButtonGroup from './atoms/GroupByButtonGroup';
import { ErrorScreen, ERROR_TYPES } from '@components/ErrorScreen';
import LoadingOverlay from '@components/LoadingOverlay';
import type { OrderbookOrdersSortedObject, OrderbookProps } from './types';
import { calculateSpread } from './utils';
import { useOrderbookController } from './hooks';

const ENABLE_TWO_WAY_REDUCER_ACTIONS = true;

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

const OrderbookComponent: FC<OrderbookProps> = ({
  initialGroupBy = 100,
  productId = 'PI_XBTUSD',
  webSocketUri = 'wss://www.cryptofacilities.com/ws/v1',
}) => {
  /*const [rdbg, setRdbg] = React.useState<string[]>([]);
  const addRdbg = React.useCallback((t) => {
    console.log('-> ', t);
    setRdbg((x) => [...x, t]);
  }, []);

   <ScrollView
            style={{
              position: 'absolute',
              width: '100%',
              top: 50,
              zIndex: 100,
              height: '60%',
            }}>
            <Text style={{ color: 'white' }}>{rdbg.length} TIMER STATE:</Text>
            {rdbg.map((t, tidx) => (
              <Text key={tidx} style={{ color: 'white' }}>
                {t}
              </Text>
            ))}
          </ScrollView>
  */
  const { asksData, bidsData, isLoading, orderBookDispatch, groupBy, wsState } =
    useOrderbookController({
      disableTwoWayProcessing: !ENABLE_TWO_WAY_REDUCER_ACTIONS,
      subscribeToProductIds: [productId],
      initialGroupBy,
      webSocketUri,
    });

  const spreadCalcIsReady = false; // orderBook.asks.length > 0 && orderBook.bids.length > 0;

  return (
    <View style={styles.flex1}>
      {!isLoading && wsState.connected === false && (
        <ErrorScreen
          errorType={
            /*  connectionStatus.connectedToInternet === false
              ? ERROR_TYPES.INTERNET_IS_UNAVAILABLE
              : */ ERROR_TYPES.SERVICE_IS_UNAVAILABLE
          }
        />
      )}

      <View style={styles.orderBookSubWrapper}>
        <View style={styles.firstColWrap}>
          <OrderbookSection
            keyPrefix={'a_'}
            backgroundColor={'#7c0a02'}
            normalizedData={asksData}
            totalOrderBy={'asc'}
          />
        </View>
        <View style={styles.orderBookSummaryWrap}>
          {/*spreadCalcIsReady && (
            <SpreadWidget bids={orderBook.bids} asks={orderBook.asks} />
          )*/}
          <Text style={styles.groupText}>Group: {groupBy}</Text>
          <GroupByButtonGroup
            groupBy={groupBy}
            orderBookDispatch={orderBookDispatch}
          />
        </View>
        <View style={styles.secondColWrap}>
          <OrderbookSection
            keyPrefix={'b_'}
            backgroundColor={'#043927'}
            normalizedData={bidsData}
            totalOrderBy={'desc'}
          />
        </View>
      </View>
      <LoadingOverlay visible={isLoading} />
    </View>
  );
};

export default OrderbookComponent;

const styles = StyleSheet.create({
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

  groupText: { flex: 1, flexShrink: 0, color: '#fff' },
  firstColWrap: {
    height: '45%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  secondColWrap: { height: '45%', overflow: 'hidden' },
  flex1: { flex: 1 },
});
