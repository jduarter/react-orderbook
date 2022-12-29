import type { ExchangeModule } from '../screens/Orderbook/types';

import { applyFnToScope } from '../screens/Orderbook/utils';

import { Decimal } from 'decimal.js';

const toOptimalInteger = (input, optimalIntReprPowFactor: number) => {
  const d = new Decimal(input);

  return d.mul(10 ** optimalIntReprPowFactor).toNumber();
};

const toNormalizedMap = (
  input: [string, string][],
  optimalIntReprPowFactor: number = 2,
): [number, Decimal][] => {
  return input.map((el) => [
    toOptimalInteger(el[0], optimalIntReprPowFactor),
    new Decimal(el[1]),
  ]);
};

const getSnapshotFromApi = async (symbol: string) => {
  const url =
    'https://api.binance.com/api/v3/depth?symbol=' + symbol + '&limit=1000';

  const request = await fetch(url);

  const result = await request.json();

  return result;
};

const Binance: ExchangeModule = {
  defaultOptions: {
    uri: 'wss://stream.binance.com:9443/ws/tornbusd@depth', // wss://data-stream.binance.com',
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

  onMessage: (dispatchToQ) => (decoded) => {
    console.log('GOT MESSAGE FROM WS: ', decoded);

    if (decoded?.result === null) {
      console.log('Orderbook: Websocket info: ', decoded);
      return;
    }

    if (decoded?.e !== 'depthUpdate') {
      console.warn('Orderbook: Unknown message received from WebSocket: ', {
        decoded,
      });
      return;
    }

    const updates = applyFnToScope(
      { bids: toNormalizedMap(decoded.b), asks: toNormalizedMap(decoded.a) },
      (kv) => new Map(kv),
    );
    dispatchToQ([{ kind: 'u', updates }]);
  },
  onOpen:
    (orderBookDispatch, defaultProduct, dispatchToQ) =>
    ({ current: { send } }) => {
      getSnapshotFromApi(defaultProduct.pairName.toUpperCase())
        .then((snapshotData) => {
          const updates = applyFnToScope(
            {
              bids: toNormalizedMap(snapshotData.bids),
              asks: toNormalizedMap(snapshotData.asks),
            },
            (kv) => new Map(kv),
          );

          // @todo: consider lastUpdateId

          dispatchToQ([{ kind: 's', updates }]);

          orderBookDispatch({
            type: 'SET_LOADING',
            payload: { value: false },
          });
        })
        .catch((err) => {
          console.log('ERROR getting snapshot data: ', err);
        });
    },
};

export default Binance;
