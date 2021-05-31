import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import AnimatedTextValue from './AnimatedTextValue';
import {
  formatNumber,
  getPrintPriceForNormalizedPrice,
  customFormatNumberToFloat,
} from '../utils';
import type { OrderbookNormalizedPrice } from '../types';

interface Props {
  price: OrderbookNormalizedPrice;
  val: number;
  total: number;
  isLeaving: boolean;
  backgroundColor: string;
}

const OrderbookRow: React.FC<Props> = ({
  price,
  val,
  backgroundColor,
  isLeaving,
  total,
}) => {
  /*dynamically adjust decimals in the parent component (@todo)*/
  const priceComponent = React.useMemo(
    () => (
      <Text style={styles.priceText}>
        {getPrintPriceForNormalizedPrice(
          price,
          customFormatNumberToFloat(price) > 1000 ? 0 : 2,
        )}
      </Text>
    ),
    [price],
  );

  return (
    <View style={styles.orderBookRowWrap}>
      {priceComponent}
      <AnimatedTextValue
        backgroundColor={backgroundColor}
        style={styles.orderBookMainText}
        isLeaving={isLeaving}>
        {formatNumber(val, 0)}
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
