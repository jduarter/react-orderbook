import type { ExchangeModule } from '../screens/Orderbook/types';

import { applyFnToScope } from '../screens/Orderbook/utils';

import { ensureConsistencyWithDiff } from '../screens/Orderbook/reducers/grouping';
import { reducePendingGroupUpdatesToState } from '../screens/Orderbook/reducers';

const ALLOWED_FEEDS = ['book_ui_1', 'book_ui_1_snapshot'];

const CryptoFacilities: ExchangeModule = {
  defaultOptions: {
    uri: 'wss://www.cryptofacilities.com/ws/v1',
    subscribeToProductIds: ['PI_XBTUSD'],
    groupBy: 0.5,
  },
  onMessage: (dispatchToQ) => (decoded) => {
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

    const updates = applyFnToScope(decoded, (kv) => new Map(kv));

    switch (decoded.feed) {
      case 'book_ui_1':
        dispatchToQ([{ kind: 'u', updates }]);
        break;
      case 'book_ui_1_snapshot':
        dispatchToQ([{ kind: 's', updates }]);
        break;
    }
  },
  onOpen:
    (orderBookDispatch, subscribeToProductIds) =>
    ({ current: { send } }) => {
      orderBookDispatch({ type: 'SET_LOADING', payload: { value: false } });
      send({
        event: 'subscribe',
        feed: 'book_ui_1',
        product_ids: subscribeToProductIds,
      });
    },
  mainReducerOverrides: {
    UPDATE_GROUPED: (state, action) => {
      return {
        ...ensureConsistencyWithDiff(
          state,
          reducePendingGroupUpdatesToState(action.payload.updates, state),
        ),
        isLoading: false,
      };
    },
  },
};

export default CryptoFacilities;
