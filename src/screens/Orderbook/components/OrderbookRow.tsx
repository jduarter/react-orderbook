import * as React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

import AnimatedTextValue from './AnimatedTextValue';
import { formatNumber, getPrintPriceForNormalizedPrice } from '../utils';
import type { OrderbookNormalizedPrice } from '../types';

const OrderbookRow: React.FC<{
  price: OrderbookNormalizedPrice;
  val: number;
  total: number;
  highlightingTextColor?: string;
  textColor?: string;
}> = ({
  price,
  val,
  total,
  textColor = '#d0f0c0',
  highlightingTextColor = '#fff',
}) => {
  return (
    <View style={styles.orderBookRowWrap}>
      <Text style={{ color: textColor, flex: 1 }}>
        {getPrintPriceForNormalizedPrice(price)}
      </Text>
      <AnimatedTextValue
        highlightingTextColor={highlightingTextColor}
        textColor={textColor}
        style={styles.orderBookMainText}>
        {formatNumber(val, 0)}
      </AnimatedTextValue>
      <AnimatedTextValue
        highlightingTextColor={highlightingTextColor}
        textColor={textColor}
        style={styles.orderBookMainText}>
        {formatNumber(total, 0)}
      </AnimatedTextValue>
    </View>
  );
};

const MemoizedOrderbookRow = React.memo(OrderbookRow);

export default MemoizedOrderbookRow;

const styles = StyleSheet.create({
  orderBookMainText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Monospace' : 'monospace',
  },
  orderBookRowWrap: { padding: 10, flexDirection: 'row' },
});
