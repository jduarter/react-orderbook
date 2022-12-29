import type { ExchangeModule, OrdersMap } from '../screens/Orderbook/types';

import { applyFnToScope } from '../screens/Orderbook/utils';

import { Decimal } from 'decimal.js';

// snapshot of around 10 minutes from Binance/TORN_BUSD pair,
// for solid websocket emulation.
const fakedJsonData = require('./mockJsonData/binance-tornbusd.json');

const toOptimalInteger = (
  input: number | string,
  optimalIntReprPowFactor: number,
) => {
  const d = new Decimal(input);

  return d.mul(10 ** optimalIntReprPowFactor).toNumber();
};

const toNormalizedMap = (
  input: [string, string][],
  optimalIntReprPowFactor: number = 2,
): OrdersMap => {
  return new Map(
    input.map((el) => [
      toOptimalInteger(el[0], optimalIntReprPowFactor),
      new Decimal(el[1]),
    ]),
  );
};

// https://gist.github.com/irazasyed/5382444
const asyncSleep = (ms: number): Promise<unknown> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const FakeProviderFromJsonFile: ExchangeModule = {
  defaultOptions: {
    uri: '',
    defaultProduct: {
      pairName: 'tornbusd', // 'btcusdt',
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
  },
  fakeRemote: async (orderBookDispatch, dispatchToQ) => {
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
          (kv) => toNormalizedMap(kv),
        );

        dispatchToQ([{ kind: 'u', updates }]);
      } else if (isSnapshotUpdate) {
        // {"ln": {"data": {"asks": [Array], "bids": [Array], "lastUpdateId": 113354265}, "timeToSleep": 272}}

        // @todo: consider lastUpdateId
        const updates = applyFnToScope(ln.data, (kv) => toNormalizedMap(kv));
        dispatchToQ([{ kind: 's', updates }]);

        orderBookDispatch({
          type: 'SET_LOADING',
          payload: { value: false },
        });
      }

      console.log({});
      await asyncSleep(ln.timeToSleep);
    }
  },
  onMessage: () => () => null,
  onOpen: () => () => null,
};

export default FakeProviderFromJsonFile;
