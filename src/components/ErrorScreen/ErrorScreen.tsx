import * as React from 'react';
import { View, Images, StyleSheet, Platform } from 'react-native';

import { ERROR_TITLES } from './constants';

const ErrorScreen: React.FC<ErrorScreenProps> = ({ errorType }) => (
  <View style={styles.wrapper}>
    <Image
      source={require('./assets/error.gif')}
      style={{ width: '100%', height: '100%', position: 'absolute' }}
    />
    <Text style={styles.title}>{ERROR_TITLES[errorType]}</Text>
  </View>
);

export default ErrorScreen;

const styles = StyleSheet.create({
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
    fontFamily: Platform.OS === 'ios' ? 'Monospace' : 'monospace',
    color: '#c7ea46',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
