/* eslint security/detect-object-injection:0 */

import {
  getGroupedPrice,
  applyFnToScope,
  wipeZeroRecords,
  extractPricesFromMap,
  arrayAt,
  mapToSortedArr,
} from './utils';

import type {
  OrderbookGenericScopeDataType,
  OrderbookStateType,
  OrdersMap,
  OrderbookReducerAction,
} from './types';

const scope = <T extends OrdersMap = OrdersMap>(
  bids: T,
  asks: T,
): { bids: T; asks: T } => ({
  bids,
  asks,
});

export const INITIAL_ORDERBOOK_STATE: OrderbookStateType = {
  ...scope(new Map(), new Map()),
  groupBy: 100,
  grouped: scope(new Map(), new Map()),
  isLoading: true,
};

export const reduceKeyPairToState = <T extends Map<number, number> = OrdersMap>(
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

const reduceUpdatesToScopedState = (
  update: OrderbookGenericScopeDataType<OrdersMap>,
  initialState: OrderbookGenericScopeDataType<OrdersMap>,
): OrderbookGenericScopeDataType<OrdersMap> =>
  applyFnToScope(initialState, (sc, k) => reduceKeyPairToState(update[k], sc));

const reduceUpdatesToScopedStateForGrouped = (
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

const applyMinimumThresholdsToGroups = (
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

const sortedObjValueSymDiff = (a: number[], b: number[]): number[] =>
  a.filter((x) => !b.includes(x)).concat(b.filter((x) => !a.includes(x)));

const calculateDiff = (
  before: number[],
  after: number[],
): { created: number[]; removed: number[] } => ({
  created: after.filter((x) => !before.includes(x)),
  removed: before.filter((x) => !after.includes(x)),
});

type AllScopePropertyNames = 'bids' | 'asks';

const reduceTwoScopesWithFn = <
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

type GroupsMembersDiffType = OrderbookGenericScopeDataType<{
  created: number[];
  removed: number[];
}>;

const getGroupMembersDiff = (
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

const enforceGroupConsistency = (
  groupName: 'asks' | 'bids',
  xDiffFn: typeof Math.min | typeof Math.max,
  selectFirstRowFn: (arr: [number, number][]) => number,
  slicerCondFn: (a: number, b: number) => boolean,
  slicerFn: (arr: [number, number][]) => [number, number][],
  altGroupName: 'asks' | 'bids',
  newGrouped: OrderbookGenericScopeDataType<OrdersMap>,
  groupsDiff: GroupsMembersDiffType,
  groupedAltGroup: OrdersMap,
): void => {
  if (groupsDiff[groupName].created.length > 0) {
    const cheaperDiff = xDiffFn(...groupsDiff[groupName].created);
    let newArr = mapToSortedArr(groupedAltGroup);

    if (newArr.length > 0) {
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
    }
  }
  return;
};
const enforceAsksConsistency = (
  newGrouped: OrderbookGenericScopeDataType<OrdersMap>,
  groupsDiff: GroupsMembersDiffType,
  groupedAsks: OrdersMap,
): void =>
  enforceGroupConsistency(
    'bids',
    Math.max,
    (arr) => arrayAt(arr, 0)[0],
    (a, b) => a > b,
    (arr) => arr.slice(1),
    'asks',
    newGrouped,
    groupsDiff,
    groupedAsks,
  );

const enforceBidsConsistency = (
  newGrouped: OrderbookGenericScopeDataType<OrdersMap>,
  groupsDiff: GroupsMembersDiffType,
  groupedBids: OrdersMap,
): void =>
  enforceGroupConsistency(
    'asks',
    Math.min,
    (arr) => arrayAt(arr, -1)[0],
    (a, b) => a < b,
    (arr) => arr.slice(1),
    'bids',
    newGrouped,
    groupsDiff,
    groupedBids,
  );

// the "ensureConsistencyWithDiff" is to make sure some
// rows are properly wiped (the API doesnt have a "snapshot" action,
// therefore, some estimations are made, specially over the first
// renders of the widget).

const ensureConsistencyWithDiff = (
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

const scopeElementsWithoutZeroRecords = (
  sc: Pick<OrderbookGenericScopeDataType<OrdersMap>, 'bids' | 'asks'>,
): Pick<OrderbookGenericScopeDataType<OrdersMap>, 'bids' | 'asks'> =>
  applyFnToScope<
    OrdersMap,
    OrdersMap,
    Pick<OrderbookGenericScopeDataType<OrdersMap>, 'bids' | 'asks'>
  >(sc, wipeZeroRecords);

const reducePendingGroupUpdatesToState = (
  pendingGroupUpdates: OrderbookGenericScopeDataType<OrdersMap>[],
  state: OrderbookStateType,
): OrderbookStateType =>
  Array.from(pendingGroupUpdates).reduce((acc: OrderbookStateType, updates) => {
    const { bids, asks, grouped, ...restOfAcc } = acc;

    const groupedWithMinimumThresholdsApplied = applyFnToScope(
      grouped,
      (sc, k) => applyMinimumThresholdsToGroups(sc, state.groupBy, updates[k]),
    );

    const newState = reduceUpdatesToScopedStateForGrouped(
      updates,
      groupedWithMinimumThresholdsApplied,
      state.groupBy,
      scope(bids, asks),
    );

    return {
      ...restOfAcc,
      ...scopeElementsWithoutZeroRecords(newState),
      grouped: scopeElementsWithoutZeroRecords(newState.grouped),
    };
  }, state);

const reduceStateToNewGroupBySetting = (
  state: OrderbookStateType,
  groupBy: number,
): OrderbookStateType => {
  const { grouped } = reduceUpdatesToScopedStateForGrouped(
    scope(new Map(), new Map()),
    { ...INITIAL_ORDERBOOK_STATE.grouped },
    groupBy,
    scope(state.bids, state.asks),
  );

  return { ...state, groupBy, grouped };
};

export const orderBookReducer = (
  state: OrderbookStateType,
  action: OrderbookReducerAction,
): OrderbookStateType => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload.value };

    case 'UPDATE_GROUPED':
      return {
        ...ensureConsistencyWithDiff(
          state.grouped,
          reducePendingGroupUpdatesToState(action.payload.updates, state),
        ),
        isLoading: false,
      };

    case 'SET_GROUP_BY':
      return reduceStateToNewGroupBySetting(state, action.payload.value);

    default:
      throw new Error('orderBook: unknown reducer: ' + action.type);
  }
};
