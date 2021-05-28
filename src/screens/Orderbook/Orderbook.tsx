import React, { useMemo, useCallback, useState, useEffect } from 'react';
import type { FC } from 'react';
import { StyleSheet, Text, View, Image, Platform } from 'react-native';

import { useDebounceCallback } from '@react-hook/debounce';

import { default as OrderbookSection } from './components/OrderbookSection';

import GroupButton from './atoms/GroupButton';
import LoadingOverlay from '@components/LoadingOverlay';
import type { OrderbookOrdersSortedObject } from './types';
import { getGroupByFactor } from './utils';
import { useOrderbookController } from './hooks';

const ENABLE_TWO_WAY_REDUCER_ACTIONS = true;

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

interface OrderbookProps {
  initialGroupBy?: number;
  productId: string;
}

const ERROR_TYPES = {
  INTERNET_IS_UNAVAILABLE: Symbol('INTERNET_IS_UNAVAILABLE'),
  SERVICE_IS_UNAVAILABLE: Symbol('SERVICE_IS_UNAVAILABLE'),
};
interface ErrorScreenProps {
  errorType:
    | typeof ERROR_TYPES.INTERNET_IS_UNAVAILABLE
    | typeof ERROR_TYPES.SERVICE_IS_UNAVAILABLE;
}

const ERROR_TITLES = {
  [ERROR_TYPES.INTERNET_IS_UNAVAILABLE]: 'Internet seems to be unavailable.',
  [ERROR_TYPES.SERVICE_IS_UNAVAILABLE]: 'Service is not available.',
};

const ErrorScreen: React.FC<ErrorScreenProps> = ({ errorType }) => (
  <View style={styles.genericConnectionProblemWrapper}>
    <Image
      source={require('./assets/error.gif')}
      style={{ width: '100%', height: '100%', position: 'absolute' }}
    />
    <Text
      style={{
        textAlign: 'center',
        margin: '10%',
        marginTop: '30%',
        fontFamily: Platform.OS === 'ios' ? 'Monospace' : 'monospace',
        color: '#c7ea46',
        fontSize: 20,
        fontWeight: 'bold',
      }}>
      {ERROR_TITLES[errorType]}
    </Text>
  </View>
);

const getGroupByButtonPressEventHandler =
  (v: -1 | 1, groupBy: number, orderBookDispatch: React.Dispatch<any>) => () =>
    getGroupByFactor(groupBy, v) &&
    orderBookDispatch({
      type: 'SET_GROUP_BY',
      payload: {
        value:
          v === -1
            ? groupBy / getGroupByFactor(groupBy, v)
            : groupBy * getGroupByFactor(groupBy, v),
      },
    });

const GroupByButtons: React.FC<{
  groupBy: number;
  orderBookDispatch: React.DispatchWithoutAction;
}> = ({ groupBy, orderBookDispatch }) => (
  <View style={styles.groupByButtonsWrap}>
    <GroupButton
      title={'-'}
      style={styles.flex1}
      onPress={getGroupByButtonPressEventHandler(
        -1,
        groupBy,
        orderBookDispatch,
      )}
    />
    <GroupButton
      title={'+'}
      style={styles.flex1}
      onPress={getGroupByButtonPressEventHandler(1, groupBy, orderBookDispatch)}
    />
  </View>
);

const OrderbookComponent: FC<OrderbookProps> = ({
  initialGroupBy = 100,
  productId = 'PI_XBTUSD',
}) => {
  const {
    asksData,
    bidsData,
    isLoading,
    orderBookDispatch,
    groupBy,
    connectionStatus,
  } = useOrderbookController({
    disableTwoWayProcessing: !ENABLE_TWO_WAY_REDUCER_ACTIONS,
    subscribeToProductIds: [productId],
    initialGroupBy,
  });

  const spreadCalcIsReady = false; // orderBook.asks.length > 0 && orderBook.bids.length > 0;

  return (
    <View style={styles.flex1}>
      {!isLoading && connectionStatus.websocket.connected === false && (
        <ErrorScreen
          errorType={
            connectionStatus.connectedToInternet === false
              ? ERROR_TYPES.INTERNET_IS_UNAVAILABLE
              : ERROR_TYPES.SERVICE_IS_UNAVAILABLE
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
          <GroupByButtons
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
  genericConnectionProblemWrapper: {
    backgroundColor: '#000',
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
  groupByButtonsWrap: { padding: 4, flex: 1, flexDirection: 'row' },
  groupText: { flex: 1, flexShrink: 0, color: '#fff' },
  firstColWrap: {
    height: '45%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  secondColWrap: { height: '45%', overflow: 'hidden' },
  flex1: { flex: 1 },
});
