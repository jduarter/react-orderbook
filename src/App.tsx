import React from 'react';
import type { FC } from 'react';
import { SafeAreaView, ScrollView, StatusBar, View } from 'react-native';

import { Orderbook } from './screens/Orderbook';

const App: FC = () => {
    const backgroundStyle = {
        backgroundColor: '#fff',
    };

    return (
        <SafeAreaView style={[backgroundStyle, { flex: 1 }]}>
            <StatusBar barStyle={'light-content'} />

            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                contentContainerStyle={{ flexGrow: 1 }}
                style={[backgroundStyle, { flex: 1 }]}>
                <View style={{ flex: 1 }}>
                    <Orderbook />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default App;
