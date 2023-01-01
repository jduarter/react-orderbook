import type { ExchangeModule } from '../screens/Orderbook/types';

import { applyFnToScope, toNormalizedMap } from '../screens/Orderbook/utils';

const getSnapshotFromApi = async (symbol: string) => {
  const url =
    'https://api.binance.com/api/v3/depth?symbol=' + symbol + '&limit=1000';

  const request = await fetch(url);
  const result = await request.json();
  return result;
};

const DEFAULT_OPTIONS = {
  uri: 'wss://stream.binance.com:9443/ws/tornbusd@depth', // wss://data-stream.binance.com',
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

const Binance: ExchangeModule = {
  defaultOptions: DEFAULT_OPTIONS,

  onMessage: (orderBookReducer) => (decoded) => {
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

    const updates = applyFnToScope({ bids: decoded.b, asks: decoded.a }, (kv) =>
      toNormalizedMap(
        kv,
        DEFAULT_OPTIONS.defaultProduct.optimalIntReprPowFactor,
      ),
    );

    orderBookDispatch({
      type: 'UPDATE_GROUPED',
      payload: { updates: [{ kind: 'u', updates }] },
    });
  },
  onOpen:
    (orderBookDispatch, defaultProduct, dispatchToQ) =>
    ({ current: { send } }) => {
      getSnapshotFromApi(defaultProduct.pairName.toUpperCase())
        .then((snapshotData) => {
          const updates = applyFnToScope(snapshotData, (kv) =>
            toNormalizedMap(
              kv,
              DEFAULT_OPTIONS.defaultProduct.optimalIntReprPowFactor,
            ),
          );

          // @todo: consider lastUpdateId

          orderBookDispatch({
            type: 'UPDATE_GROUPED',
            payload: { updates: [{ kind: 's', updates }] },
          });

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
