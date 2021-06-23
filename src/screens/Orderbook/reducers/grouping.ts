import {
  getGroupedPrice,
  applyFnToScope,
  extractPricesFromMap,
  arrayAt,
  mapToSortedArr,
  scope,
  sortedObjValueSymDiff,
  calculateDiff,
} from '../utils';

import { reduceUpdatesToScopedState, reduceTwoScopesWithFn } from './common';

import type {
  OrderbookGenericScopeDataType,
  OrdersMap,
  OrderbookStateType,
} from '../types';
import type { GroupsMembersDiffType } from './types';

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

    const oldSizeForExact = lastKnownExactValues.get(price);

    const exactDiff =
      oldSizeForExact === undefined ? v : -1 * ((oldSizeForExact || 0) - v);

    const oldGroupSize = acc.get(groupedPrice) || 0;

    const sumB = oldGroupSize + exactDiff;

    if (oldGroupSize > 0 && exactDiff !== 0 && sumB >= 0) {
      acc.set(groupedPrice, sumB);
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

export const applyMinimumThresholdsToGroups = (
  groups: OrdersMap,
  groupBy: number,
  updates: OrdersMap,
): OrdersMap => {
  if (updates.size === 0) {
    return groups;
  }

  const groupMins = new Map(groups);
  for (const [exactPriceInFloat, absoluteSizeInUpdate] of updates) {
    groupMins.set(
      getGroupedPrice(exactPriceInFloat, groupBy),
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

    if (newGroupSize > 0) {
      result.set(groupPrice, newGroupSize);
    }
  }

  return result;
};

export const getGroupMembersDiff = (
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

type EGCParamsTupleType = [
  /* groupName */ 'asks' | 'bids',
  /* xDiffFn */ typeof Math.min | typeof Math.max,
  /* selectFirstRowFn */ (arr: [number, number][]) => number,
  /* slicerCondFn */ (a: number, b: number) => boolean,
  /* slicerFn */ (arr: [number, number][]) => [number, number][],
  /* altGroupName */ 'asks' | 'bids',
];

type EGCArgumentsType = [
  ...EGCParamsTupleType,
  /* newGrouped */ OrderbookGenericScopeDataType<OrdersMap>,
  /* groupsDiff */ GroupsMembersDiffType,
  /* groupedAltGroup */ OrdersMap,
];

type EGCFunctionType = (...args: EGCArgumentsType) => void;

export const enforceGroupConsistency: EGCFunctionType = (
  groupName,
  xDiffFn,
  selectFirstRowFn,
  slicerCondFn,
  slicerFn,
  altGroupName,
  newGrouped,
  groupsDiff,
  groupedAltGroup,
) => {
  if (groupsDiff[groupName].created.length <= 0) {
    return;
  }
  const cheaperDiff = xDiffFn(...groupsDiff[groupName].created);
  let newArr = mapToSortedArr(groupedAltGroup);

  if (newArr.length <= 0) {
    return;
  }

  do {
    if (newArr.length === 0) {
      break;
    }
    const firstRow = selectFirstRowFn(newArr);

    if (slicerCondFn(cheaperDiff, firstRow)) {
      newArr = slicerFn(newArr);
    } else {
      break;
    }
    // eslint-disable-next-line no-constant-condition
  } while (true);
  newGrouped[altGroupName] = new Map(newArr);
};

const EC_ASKS_PARAMS: EGCParamsTupleType = [
  'bids',
  Math.max,
  (arr: [number, number][]): number => arrayAt(arr, 0)[0],
  (a: number, b: number) => a > b,
  (arr: any[]): any[] => arr.slice(1),
  'asks',
];

export const enforceAsksConsistency = (
  newGrouped: OrderbookGenericScopeDataType<OrdersMap>,
  groupsDiff: GroupsMembersDiffType,
  groupedAsks: OrdersMap,
): void =>
  enforceGroupConsistency(
    ...([
      ...EC_ASKS_PARAMS,
      newGrouped,
      groupsDiff,
      groupedAsks,
    ] as EGCArgumentsType),
  );

const EC_BIDS_PARAMS: EGCParamsTupleType = [
  'asks',
  Math.min,
  (arr: [number, number][]): number => arrayAt(arr, -1)[0],
  (a: number, b: number) => a < b,
  (arr: any[]): any[] => arr.slice(1),
  'bids',
];

export const enforceBidsConsistency = (
  newGrouped: OrderbookGenericScopeDataType<OrdersMap>,
  groupsDiff: GroupsMembersDiffType,
  groupedBids: OrdersMap,
): void =>
  enforceGroupConsistency(
    ...([
      ...EC_BIDS_PARAMS,
      newGrouped,
      groupsDiff,
      groupedBids,
    ] as EGCArgumentsType),
  );

// the "ensureConsistencyWithDiff" is to make sure some
// rows are properly wiped (the API doesnt have a "snapshot" action,
// therefore, some estimations are made, specially over the first
// renders of the widget).

export const ensureConsistencyWithDiff = (
  grouped: OrderbookGenericScopeDataType<OrdersMap>,
  acc: OrderbookStateType,
): OrderbookStateType => {
  const { grouped: newGrouped } = acc;

  const groupsDiff = getGroupMembersDiff(grouped, acc.grouped);

  // a) if new asks are added, check if bids should be corrected
  enforceAsksConsistency(newGrouped /* ref */, groupsDiff, acc.grouped.asks);

  // b) if new bids are added, check if asks should be corrected
  enforceBidsConsistency(newGrouped /* ref */, groupsDiff, acc.grouped.bids);

  return { ...acc, grouped: newGrouped };
};
