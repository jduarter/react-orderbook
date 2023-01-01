import React from 'react';

import type { FC } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import type { ExchangeModule } from '../../screens/Orderbook/types';

export interface ExchangeSelectorProps {
  exchanges: { module: ExchangeModule; name: string }[];
  onPress: (module: ExchangeModule, key: number) => void;
}

const ExchangeSelector: FC<ExchangeSelectorProps> = ({
  exchanges,
  onPress,
}) => {
  return (
    <View style={{ margin: 25, paddingTop: 50 }}>
      <Text style={{ marginBottom: 20, fontSize: 18, marginTop: 20 }}>
        Select an exchange:
      </Text>
      {exchanges.map(({ module, name }, k) => (
        <TouchableOpacity
          key={k}
          onPress={() => onPress(module, k)}
          style={styles.defaultTouchableStyle}>
          <Text style={styles.exchangeSelectorDefaultStyle}>{name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ExchangeSelector;

const styles = StyleSheet.create({
  defaultTouchableStyle: { minWidth: 44, minHeight: 44 },
  exchangeSelectorDefaultStyle: {
    color: '#333',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
