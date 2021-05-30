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
  backgroundColor,
  total,
  textColor = '#d0f0c0',
  highlightingTextColor = '#fff',
}) => {
  const n1 = formatNumber(val, 0);

  return (
    <View style={styles.orderBookRowWrap}>
      <Text style={{ color: textColor, fontSize: 16, flex: 1, marginTop: 2 }}>
        {getPrintPriceForNormalizedPrice(
          price,
          /*dynamically adjust decimals in the parent component (@todo)*/
          price > 1000 ? 0 : 2,
        )}
      </Text>

      {n1.split(',').map((nn, idx) => (
        <AnimatedTextValue
          key={idx + '_' + nn}
          backgroundColor={backgroundColor}
          highlightingTextColor={highlightingTextColor}
          textColor={textColor}
          style={styles.orderBookMainText}>
          {idx !== 0 ? ',' : null}
          {nn}
        </AnimatedTextValue>
      ))}

      <AnimatedTextValue
        highlightingTextColor={highlightingTextColor}
        textColor={textColor}
        style={styles.orderBookMainTextTotal}>
        {formatNumber(total, 0)}
      </AnimatedTextValue>
    </View>
  );
};

const MemoizedOrderbookRow = React.memo(OrderbookRow);

export default MemoizedOrderbookRow;

const styles = StyleSheet.create({
  orderBookMainText: {
    // width: '30%',
    // marginLeft: '10%',
    fontSize: 17,
    fontWeight: '400',
    fontFamily: 'Roboto Mono',
    //Platform.OS === 'ios' ? 'Monospace' : 'monospace',
  },
  orderBookMainTextTotal: {
    width: '40%',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'right',
    fontFamily: 'Roboto Mono', //Platform.OS === 'ios' ? 'Monospace' : 'monospace',
  },
  orderBookRowWrap: {
    width: '100%',
    /*  borderColor: 'black',
    borderWidth: 1,*/
    padding: 8,
    margin: 2,
    flexDirection: 'row',
  },
});
