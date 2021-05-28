import React from 'react';
import type { FC } from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';
import Orientation from 'react-native-orientation-locker';

import { Orderbook } from './screens/Orderbook';

const backgroundStyle = {
  backgroundColor: '#000',
};

const App: FC = () => {
  React.useEffect(() => {
    Orientation.lockToPortrait();
  }, []);

  return (
    <SafeAreaView style={[backgroundStyle, { flex: 1 }]}>
      <StatusBar barStyle={'dark-content'} hidden={true} />

      <View style={[backgroundStyle, { flex: 1 }]}>
        <Orderbook productId={'PI_XBTUSD'} />
      </View>
    </SafeAreaView>
  );
};

export default App;
