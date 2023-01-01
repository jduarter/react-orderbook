import * as React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

import type { Decimal } from 'decimal.js';

import AnimatedTextValue from './AnimatedTextValue';

interface Props {
  price: string;
  val: Decimal;
  total: Decimal;
  isLeaving: boolean;
  backgroundColor: string;
  backgroundColorForWeights: string;
  relSizeWeight: number;
}

const getAnimationOptions = ({
  isLeaving,
  backgroundColor,
}: {
  isLeaving: boolean;
  backgroundColor: string;
}) => ({
  shouldPlay: !isLeaving,
  backgroundColor,
  maxFrequencyMs: 5000,
});

const ANIMATIONS = true;

const OrderbookRow: React.FC<Props> = ({
  price,
  val,
  backgroundColor,
  backgroundColorForWeights,
  isLeaving,
  total,
  relSizeWeight,
}) => {
  if (ANIMATIONS) {
    return (
      <View style={styles.orderBookRowWrap}>
        <View
          style={{
            position: 'absolute',
            backgroundColor: backgroundColorForWeights,
            height: '100%',
            padding: 18,
            marginTop: 2,
            width: Math.round(relSizeWeight * 100).toString() + '%',
            right: 0,
            zIndex: -1,
          }}></View>
        <Text style={styles.priceText}>{price}</Text>

        <AnimatedTextValue
          style={styles.orderBookMainText}
          animationOpts={React.useMemo(
            () => getAnimationOptions({ backgroundColor, isLeaving }),
            [backgroundColor, isLeaving],
          )}>
          {val.toFixed()}
        </AnimatedTextValue>

        <Text style={styles.orderBookMainTextTotal}>{total.toFixed()}</Text>
      </View>
    );
  } else {
    return (
      <View style={styles.orderBookRowWrap}>
        <Text style={styles.priceText}>{price}</Text>

        <Text style={styles.orderBookMainText}>{val.toFixed(2)}</Text>

        <Text style={styles.orderBookMainTextTotal}>{total.toFixed(2)}</Text>
      </View>
    );
  }
};

const MemoizedOrderbookRow = React.memo(OrderbookRow);

export default MemoizedOrderbookRow;

const styles = StyleSheet.create({
  priceText: { color: '#fff', fontSize: 16, flex: 1, marginTop: 2 },
  orderBookMainText: {
    fontSize: 17,
    fontWeight: '400',
    fontFamily:
      Platform.OS === 'android'
        ? 'RobotoMono-VariableFont_wght'
        : 'Roboto Mono',
    color: '#fff',
  },
  orderBookMainTextTotal: {
    width: '40%',
    fontSize: 14,
    fontWeight: '400',
    color: '#fff',
    textAlign: 'right',
    fontFamily:
      Platform.OS === 'android'
        ? 'RobotoMono-VariableFont_wght'
        : 'Roboto Mono',
  },
  orderBookRowWrap: {
    width: '100%',
    padding: 8,
    margin: 2,
    flexDirection: 'row',
  },
});
