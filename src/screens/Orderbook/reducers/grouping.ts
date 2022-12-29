import {
  getGroupedPrice,
  applyFnToScope,
  extractPricesFromMap,
  scope,
  sortedObjValueSymDiff,
  calculateDiff,
} from '../utils';

import { reduceUpdatesToScopedState, reduceTwoScopesWithFn } from './common';

import type { OrderbookGenericScopeDataType, OrdersMap } from '../types';
import type { GroupsMembersDiffType } from './types';
import Decimal from 'decimal.js';

export const mutateForGrouping = (
  updates: OrdersMap,
  groupBy: number,
  inputLastKnownExactValues: OrdersMap,
  initialState: OrdersMap,
): [OrdersMap, OrdersMap] => {
  if (updates.size === 0) {
    return [initialState, inputLastKnownExactValues];
  }

  const acc = new Map(initialState);
  const lastKnownExactValues = new Map(inputLastKnownExactValues);

  for (const [price, v] of updates) {
    const groupedPrice = getGroupedPrice(price, groupBy);

    const oldGroupSize = acc.get(groupedPrice);

    if (typeof oldGroupSize === 'undefined' || oldGroupSize.isZero()) {
      acc.set(groupedPrice, v);
    } else {
      const oldSizeForExact = lastKnownExactValues.get(price) || new Decimal(0);
      const result = v.sub(oldSizeForExact);

      acc.set(groupedPrice, oldGroupSize.add(result));
    }
    lastKnownExactValues.set(price, v);
  }

  return [acc, lastKnownExactValues];
};

const mutateScopeForGrouping = (
  updates: OrderbookGenericScopeDataType<OrdersMap>,
  groupBy: number,
  oldExactRootState: OrderbookGenericScopeDataType<OrdersMap>,
  initialState: OrderbookGenericScopeDataType<OrdersMap>,
): OrderbookGenericScopeDataType<OrdersMap> & {
  groupedMutatedData: OrderbookGenericScopeDataType<OrdersMap>;
} => {
  const [bids, mainBids] = mutateForGrouping(
    updates.bids,
    groupBy,
    oldExactRootState.bids,
    initialState.bids,
  );
  const [asks, mainAsks] = mutateForGrouping(
    updates.asks,
    groupBy,
    oldExactRootState.asks,
    initialState.asks,
  );

  return {
    ...scope(mainBids, mainAsks),
    groupedMutatedData: scope(bids, asks),
  };
};

export const reduceUpdatesToScopedStateForGrouped = (
  updates: OrderbookGenericScopeDataType<OrdersMap>,
  initialState: OrderbookGenericScopeDataType<OrdersMap>,
  groupBy: number,
  oldExactRootState: OrderbookGenericScopeDataType<OrdersMap>,
) => {
  const { groupedMutatedData, ...newState } = mutateScopeForGrouping(
    updates,
    groupBy,
    oldExactRootState,
    initialState,
  );

  return {
    ...newState,
    grouped: reduceUpdatesToScopedState(groupedMutatedData, initialState),
  };
};

// unused unless for CryptoFacilities. review needed

export const applyMinimumThresholdsToGroups = (
  groups: OrdersMap,
  groupBy: number,
  minGroupBy: number,
  updates: OrdersMap,
): OrdersMap => {
  if (updates.size === 0) {
    return groups;
  }

  const groupMins = new Map(groups);
  for (const [exactPriceInFloat, absoluteSizeInUpdate] of updates) {
    groupMins.set(
      getGroupedPrice(exactPriceInFloat, groupBy, minGroupBy),
      absoluteSizeInUpdate,
    );
  }

  const result = new Map();
  for (const [groupPrice, calcSumSizeForUpdates] of groupMins) {
    const minimumSizeForGroup = groups.get(groupPrice) || 0;

    const newGroupSize =
      minimumSizeForGroup > calcSumSizeForUpdates
        ? minimumSizeForGroup
        : calcSumSizeForUpdates;

    if (newGroupSize >= 0) {
      result.set(groupPrice, newGroupSize);
    } else if (minimumSizeForGroup === 0) {
      result.set(groupPrice, 0);
    }
  }

  return result;
};

export const getScopeMembersDiff = (
  before: OrderbookGenericScopeDataType<OrdersMap>,
  after: OrderbookGenericScopeDataType<OrdersMap>,
): GroupsMembersDiffType => {
  const a = applyFnToScope<OrdersMap, number[]>(before, extractPricesFromMap);
  const b = applyFnToScope<OrdersMap, number[]>(after, extractPricesFromMap);

  const changedKeys = reduceTwoScopesWithFn<
    number[],
    number[],
    OrderbookGenericScopeDataType<number[]>
  >(a, b, sortedObjValueSymDiff);

  return reduceTwoScopesWithFn(
    applyFnToScope(before, extractPricesFromMap),
    changedKeys,
    calculateDiff,
  );
};
