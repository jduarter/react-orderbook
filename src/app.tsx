/* eslint @typescript-eslint/ban-ts-comment:0 */

import React from 'react';
import type { FC } from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';

import { initLoggers } from './services/AppLog';

import Orientation from 'react-native-orientation-locker';

import { Orderbook } from './screens/Orderbook';
// @ts-ignore
import { WEBSOCKET_URI } from 'react-native-config';
import Binance from './exchanges/Binance';
import CryptoFacilities from './exchanges/CryptoFacilities';
import FakeProviderFromJsonFile from './exchanges/FakeProviderFromJsonFile';

const backgroundStyle = {
  backgroundColor: '#000',
};

initLoggers();

const App: FC = () => {
  React.useEffect(() => {
    Orientation.lockToPortrait();
  }, []);

  return (
    <SafeAreaView style={[backgroundStyle, { flex: 1 }]}>
      <StatusBar barStyle={'dark-content'} hidden={true} />

      <View style={[backgroundStyle, { flex: 1 }]} testID={'MAIN_VIEW'}>
        <Orderbook
          exchangeModule={FakeProviderFromJsonFile}
          testID={'MAIN_ORDERBOOK_INSTANCE'}
        />
      </View>
    </SafeAreaView>
  );
};

export default App;
