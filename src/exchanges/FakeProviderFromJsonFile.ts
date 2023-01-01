import type { ExchangeModule } from '../screens/Orderbook/types';

import {
  applyFnToScope,
  toNormalizedMap,
  asyncSleep,
} from '../screens/Orderbook/utils';

// snapshot of around 10 minutes from Binance/TORN_BUSD pair,
// for solid websocket emulation.
const fakedJsonData = require('./mockJsonData/binance-tornbusd.json');

const DEFAULT_OPTIONS = {
  uri: '',
  defaultProduct: {
    pairName: 'tornbusd', // 'btcusdt',
    optimalIntReprPowFactor: 2,
    asset: {
      symbol: 'TORN',
      decimals: 8,
      decimalsToShow: 2,
    },
    price: {
      symbol: 'BUSD',
      decimals: 2,
      decimalsToShow: 2,
    },
    groupByFactors: [0.01, 0.1, 1, 10, 50, 100],
  },
  groupBy: 0.01,
};

const FakeProviderFromJsonFile: ExchangeModule = {
  defaultOptions: DEFAULT_OPTIONS,
  fakeRemote: async (orderBookDispatch) => {
    for (const ln of fakedJsonData) {
      const isWSupdate = 'E' in ln.data;
      const isSnapshotUpdate = !isWSupdate;

      if (isWSupdate) {
        //  LOG  {"ln": {"data": {"E": 1672242116715, "U": 113354266, "a": [Array], "b": [Array], "e": "depthUpdate", "s": "TORNBUSD", "u": 113354267}, "timeToSleep": 750}}
        const updates = applyFnToScope(
          {
            bids: ln.data.b,
            asks: ln.data.a,
          },
          (kv) =>
            toNormalizedMap(
              kv,
              DEFAULT_OPTIONS.defaultProduct.optimalIntReprPowFactor,
            ),
        );

        orderBookDispatch({
          type: 'UPDATE_GROUPED',
          payload: { updates: [{ kind: 'u', updates }] },
        });
      } else if (isSnapshotUpdate) {
        // {"ln": {"data": {"asks": [Array], "bids": [Array], "lastUpdateId": 113354265}, "timeToSleep": 272}}

        // @todo: consider lastUpdateId
        const updates = applyFnToScope(ln.data, (kv) =>
          toNormalizedMap(
            kv,
            DEFAULT_OPTIONS.defaultProduct.optimalIntReprPowFactor,
          ),
        );

        orderBookDispatch({
          type: 'UPDATE_GROUPED',
          payload: { updates: [{ kind: 's', updates }] },
        });

        orderBookDispatch({
          type: 'SET_LOADING',
          payload: { value: false },
        });
      }

      await asyncSleep(ln.timeToSleep);
    }
  },
  onMessage: () => () => null,
  onOpen: () => () => null,
};

export default FakeProviderFromJsonFile;
