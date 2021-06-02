import * as React from 'react';
import { View, Image, Text, StyleSheet, Platform } from 'react-native';

import { ERROR_TITLES } from './constants';
import type { ErrorScreenProps } from './types';

const ErrorScreen: React.FC<ErrorScreenProps> = ({
  errorType,
}: {
  errorType: symbol;
}) => (
  <View style={styles.wrapper}>
    <Image source={require('./assets/error.gif')} style={styles.image} />
    <Text style={styles.title}>{ERROR_TITLES.get(errorType)}</Text>
  </View>
);

export default ErrorScreen;

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%', position: 'absolute' },
  wrapper: {
    backgroundColor: '#000',
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 10,
  },
  title: {
    textAlign: 'center',
    margin: '10%',
    marginTop: '30%',
    fontFamily:
      Platform.OS === 'android'
        ? 'RobotoMono-VariableFont_wght'
        : 'Roboto Mono',
    color: '#c7ea46',
    fontSize: 20,
    fontWeight: '200',
  },
});
