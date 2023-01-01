import type { ExchangeModule } from '../screens/Orderbook/types';

import { applyFnToScope } from '../screens/Orderbook/utils';

// import { ensureConsistencyWithDiff } from '../screens/Orderbook/reducers/grouping';
// import { reducePendingGroupUpdatesToState } from '../screens/Orderbook/reducers';

const ALLOWED_FEEDS = ['book_ui_1', 'book_ui_1_snapshot'];

const DEFAULT_OPTIONS = {
  uri: 'wss://www.cryptofacilities.com/ws/v1',
  defaultProduct: {
    id: 'PI_XBTUSD',
    pairName: 'XBTUSD', // 'btcusdt',
    optimalIntReprPowFactor: 2,
    asset: {
      symbol: 'XBT',
      decimals: 8,
      decimalsToShow: 2,
    },
    price: {
      symbol: 'USD',
      decimals: 2,
      decimalsToShow: 2,
    },
    groupByFactors: [0.01, 0.1, 1, 10, 50, 100],
  },
  groupBy: 0.5,
};

const CryptoFacilities: ExchangeModule = {
  defaultOptions: DEFAULT_OPTIONS,
  onMessage: (orderBookDispatch) => (decoded) => {
    if (decoded?.event === 'info' || decoded?.event === 'subscribed') {
      console.log('Orderbook: Websocket info: ', decoded);
      return;
    }

    if (decoded?.event) {
      console.warn('Orderbook: Unknown message received from WebSocket: ', {
        decoded,
      });
      return;
    }

    if (!decoded?.feed || ALLOWED_FEEDS.indexOf(decoded?.feed) == -1) {
      console.warn('Orderbook: Unknown message received from WebSocket: ', {
        decoded,
      });
      return;
    }
    console.log({ decoded: JSON.stringify(decoded) });
    const updates = applyFnToScope(decoded, (kv) => new Map(kv));

    switch (decoded.feed) {
      case 'book_ui_1':
        orderBookDispatch({
          type: 'UPDATE_GROUPED',
          payload: { updates: [{ kind: 'u', updates }] },
        });
        break;
      case 'book_ui_1_snapshot':
        orderBookDispatch({
          type: 'UPDATE_GROUPED',
          payload: { updates: [{ kind: 's', updates }] },
        });
        break;
    }
  },
  onOpen:
    (orderBookDispatch, subscribeToProductId) =>
    ({ current: { send } }) => {
      orderBookDispatch({ type: 'SET_LOADING', payload: { value: false } });
      send({
        event: 'subscribe',
        feed: 'book_ui_1',
        product_ids: [subscribeToProductId],
      });
    },
  /* mainReducerOverrides: {
    UPDATE_GROUPED: (state, action) => {
      return {
        ...ensureConsistencyWithDiff(
          state,
          reducePendingGroupUpdatesToState(action.payload.updates, state),
        ),
        isLoading: false,
      };
    },
  },*/
};

export default CryptoFacilities;
