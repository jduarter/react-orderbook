import { applyFnToScope, wipeZeroRecords } from '../utils';

import type { OrderbookGenericScopeDataType, OrdersMap } from '../types';

export const reduceMapToState = <T extends OrdersMap = OrdersMap>(
  data: T,
  initialState: OrdersMap,
): OrdersMap => {
  const ret = new Map(initialState);
  for (const [price, oSize] of data) {
    if (oSize.isZero()) {
      ret.delete(price);
    } else {
      ret.set(price, oSize);
    }
  }
  return ret;
};

export const reduceUpdatesToScopedState = (
  update: OrderbookGenericScopeDataType<OrdersMap>,
  initialState: OrderbookGenericScopeDataType<OrdersMap>,
): OrderbookGenericScopeDataType<OrdersMap> =>
  applyFnToScope(initialState, (sc, k) => reduceMapToState(update[k], sc));

export const scopeElementsWithoutZeroRecords = (
  sc: Pick<OrderbookGenericScopeDataType<OrdersMap>, 'bids' | 'asks'>,
): Pick<OrderbookGenericScopeDataType<OrdersMap>, 'bids' | 'asks'> =>
  applyFnToScope<
    OrdersMap,
    OrdersMap,
    Pick<OrderbookGenericScopeDataType<OrdersMap>, 'bids' | 'asks'>
  >(sc, wipeZeroRecords);
