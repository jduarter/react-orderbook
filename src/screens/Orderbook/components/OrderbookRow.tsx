import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import AnimatedTextValue from './AnimatedTextValue';
import {
  formatNumber,
  getPrintPriceForNormalizedPrice,
  customFormatNumberToFloat,
} from '../utils';
import type { OrderbookNormalizedPrice } from '../types';

const OrderbookRow: React.FC<{
  price: OrderbookNormalizedPrice;
  val: number;
  total: number;
  isLeaving: boolean;
  backgroundColor: string;
}> = ({ price, val, backgroundColor, isLeaving, total }) => {
  //  console.log('[OrderbookRow] renders');
  const n1 = formatNumber(val, 0);

  const priceComponent = React.useMemo(
    () => (
      <Text style={styles.priceText}>
        {getPrintPriceForNormalizedPrice(
          price,
          /*dynamically adjust decimals in the parent component (@todo)*/
          customFormatNumberToFloat(price) > 1000 ? 0 : 2,
        )}
      </Text>
    ),
    [price],
  );
  /*
  React.useEffect(() => {
    return () => {
      console.log('[OrderbookRow] destroys');
    };
  }, []);*/
  /*     <AnimatedTextValue
        highlightingTextColor={highlightingTextColor}
        textColor={textColor}
        style={styles.orderBookMainTextTotal}>
        {formatNumber(total, 0)}
      </AnimatedTextValue>
      <Text style={styles.orderBookMainText}>{n1}</Text>

            <AnimatedTextValue
        kI={price}
        backgroundColor={backgroundColor}
        style={styles.orderBookMainText}
        isLeaving={isLeaving}>
        {n1}
      </AnimatedTextValue>
      */

  return (
    <View style={styles.orderBookRowWrap}>
      {priceComponent}
      <AnimatedTextValue
        backgroundColor={backgroundColor}
        style={styles.orderBookMainText}
        isLeaving={isLeaving}>
        {n1}
      </AnimatedTextValue>

      <Text style={styles.orderBookMainTextTotal}>
        {formatNumber(total, 0)}
      </Text>
    </View>
  );
};

const MemoizedOrderbookRow = React.memo(OrderbookRow);

export default MemoizedOrderbookRow;

const styles = StyleSheet.create({
  priceText: { color: '#fff', fontSize: 16, flex: 1, marginTop: 2 },
  orderBookMainText: {
    fontSize: 17,
    fontWeight: '400',
    fontFamily: 'Roboto Mono',
    color: '#fff',
  },
  orderBookMainTextTotal: {
    width: '40%',
    fontSize: 14,
    fontWeight: '400',
    color: '#fff',
    textAlign: 'right',
    fontFamily: 'Roboto Mono',
  },
  orderBookRowWrap: {
    width: '100%',

    padding: 8,
    margin: 2,
    flexDirection: 'row',
  },
});
