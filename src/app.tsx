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
import JestDummy from './exchanges/JestDummy';
import CryptoFacilities from './exchanges/CryptoFacilities';
import FakeProviderFromJsonFile from './exchanges/FakeProviderFromJsonFile';
import type { ExchangeModule } from './screens/Orderbook/types';
import { ExchangeSelector } from './components/ExchangeSelector';

const IN_TEST = typeof jest != 'undefined';

const IN_BROWSER = // @ts-ignore
  typeof document != 'undefined' && // @ts-ignore
  typeof window != 'undefined' && // @ts-ignore
  typeof window.location != 'undefined';

const backgroundStyle = {
  backgroundColor: '#000',
};

!IN_TEST && initLoggers();

const EXCHANGES = [
  { module: FakeProviderFromJsonFile, name: 'FakeProviderFromJsonFile' },
  { module: Binance, name: 'Binance' },
  { module: CryptoFacilities, name: 'CryptoFacilities' },
];

const App: FC = () => {
  React.useEffect(() => {
    Orientation.lockToPortrait();
  }, []);

  const exchangeModuleRef = React.useRef<ExchangeModule | null>(null);
  const [, forceUpdate] = React.useState<number>(0);
  const exchangeModule = IN_TEST ? JestDummy : exchangeModuleRef.current;

  if (!exchangeModule) {
    return (
      <ExchangeSelector
        exchanges={EXCHANGES}
        onPress={(module: ExchangeModule) => {
          exchangeModuleRef.current = module;
          forceUpdate(Date.now());
        }}
      />
    );
  }

  return (
    <SafeAreaView style={[backgroundStyle, { flex: 1 }]}>
      <StatusBar barStyle={'dark-content'} hidden={true} />

      <View
        style={[
          backgroundStyle,
          IN_BROWSER
            ? {
                width: 375,
                height: 685,
                marginLeft: 'auto',
                marginRight: 'auto',
                marginTop: 20,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: '#000',
                borderRadius: 20,
                overflow: 'hidden',
              }
            : { flex: 1 },
        ]}
        testID={'MAIN_VIEW'}>
        <Orderbook
          exchangeModule={exchangeModule}
          testID={'MAIN_ORDERBOOK_INSTANCE'}
        />
      </View>
    </SafeAreaView>
  );
};

export default App;
