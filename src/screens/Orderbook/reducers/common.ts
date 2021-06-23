import { applyFnToScope, wipeZeroRecords } from '../utils';

import type {
  OrderbookGenericScopeDataType,
  OrdersMap,
  AllScopePropertyNames,
} from '../types';

export const reduceMapToState = <T extends Map<number, number> = OrdersMap>(
  data: T,
  initialState: OrdersMap,
): OrdersMap => {
  const ret = new Map(initialState);
  for (const [price, oSize] of data) {
    if (oSize === 0) {
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

export const reduceTwoScopesWithFn = <
  T,
  FR,
  TP extends OrderbookGenericScopeDataType<T> = OrderbookGenericScopeDataType<T>,
>(
  a: TP,
  b: TP,
  fn: (aa: T, bb: T) => FR,
  scopeProps: AllScopePropertyNames[] = ['bids', 'asks'],
): OrderbookGenericScopeDataType<FR> =>
  scopeProps.reduce(
    (acc, scopeKeyName) => ({
      ...acc,
      [scopeKeyName]: fn(a[scopeKeyName], b[scopeKeyName]),
    }),
    {},
  ) as OrderbookGenericScopeDataType<FR>;

export const scopeElementsWithoutZeroRecords = (
  sc: Pick<OrderbookGenericScopeDataType<OrdersMap>, 'bids' | 'asks'>,
): Pick<OrderbookGenericScopeDataType<OrdersMap>, 'bids' | 'asks'> =>
  applyFnToScope<
    OrdersMap,
    OrdersMap,
    Pick<OrderbookGenericScopeDataType<OrdersMap>, 'bids' | 'asks'>
  >(sc, wipeZeroRecords);
