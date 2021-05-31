/* eslint security/detect-object-injection:0 */

import at from 'array.prototype.at';

import {
  getNormalizedPrice,
  getGroupedPrice,
  reduceScopeWithFn,
  wipeZeroRecords,
  getAffectedPricesInUpdateList,
} from './utils';

import type {
  OrderbookOrdersSortedObject,
  OrderbookGenericScopeDataType,
  OrderbookStateType,
  OrdersMap,
  OrderbookReducerAction,
  WSDataPriceSizePair,
} from './types';

export const INITIAL_ORDERBOOK_STATE: OrderbookStateType = {
  groupBy: 100,
  bids: new Map(),
  asks: new Map(),
  grouped: { bids: new Map(), asks: new Map() },
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
): {
  newMainState: OrderbookGenericScopeDataType<OrdersMap>;
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
    newMainState: { bids: mainBids, asks: mainAsks },
    groupedMutatedData: {
      bids,
      asks,
    },
  };
};

const reduceUpdatesToScopedState = (
  update: OrderbookGenericScopeDataType<OrdersMap>,
  initialState: OrderbookGenericScopeDataType<OrdersMap>,
): OrderbookGenericScopeDataType<OrdersMap> => ({
  bids: reduceKeyPairToState(update.bids, initialState.bids),
  asks: reduceKeyPairToState(update.asks, initialState.asks),
});

const reduceUpdatesToScopedStateForGrouped = (
  updates: OrderbookGenericScopeDataType<OrdersMap>,
  initialState: OrderbookGenericScopeDataType<OrdersMap>,
  groupBy: number,
  oldExactRootState: OrderbookGenericScopeDataType<OrdersMap>,
) => {
  const { newMainState, groupedMutatedData } = mutateScopeForGrouping(
    updates,
    groupBy,
    oldExactRootState,
    initialState,
  );

  const returnValue = reduceUpdatesToScopedState(
    groupedMutatedData,
    initialState,
  );

  return {
    newMainState,
    grouped: returnValue,
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

const getGroupMembersDiff = (
  before: OrderbookGenericScopeDataType<OrdersMap>,
  after: OrderbookGenericScopeDataType<OrdersMap>,
): OrderbookGenericScopeDataType<{ created: number[]; removed: number[] }> => {
  const a = reduceScopeWithFn<OrdersMap, number[]>(
    before,
    getAffectedPricesInUpdateList,
  );

  const b = reduceScopeWithFn<OrdersMap, number[]>(
    after,
    getAffectedPricesInUpdateList,
  );

  const changedKeys = reduceTwoScopesWithFn<
    number[],
    number[],
    OrderbookGenericScopeDataType<number[]>
  >(a, b, sortedObjValueSymDiff);

  const patchedBefore = reduceScopeWithFn(before, (m) =>
    Array.from(m).map(([price]) => price),
  );

  return reduceTwoScopesWithFn(patchedBefore, changedKeys, calculateDiff);
};

const mapToSortedArr = (m: OrdersMap): Array<number, number> => {
  const sortedObj = Array.from(m).reduce((acc, [ck, cv]) => {
    return { ...acc, [ck]: cv };
  }, {});
  return Object.entries(sortedObj).map((x) => [Number(x[0]), x[1]]);
};

const ensureConsistencyWithDiff = (
  grouped: OrderbookGenericScopeDataType<OrdersMap>,
  acc: OrderbookStateType,
): OrderbookGenericScopeDataType<OrdersMap> => {
  const newGrouped = { ...acc.grouped };

  const groupsDiff = getGroupMembersDiff(grouped, acc.grouped);

  // b) if new asks are added, check if bids should be corrected
  if (groupsDiff.asks.created.length > 0) {
    const cheaperDiffAsk = Math.min(...groupsDiff.asks.created);

    let newBidsArr = mapToSortedArr(acc.grouped.bids);

    if (newBidsArr.length > 0) {
      do {
        if (newBidsArr.length === 0) {
          break;
        }
        const firstBidRow = at(newBidsArr, -1)[0];
        if (cheaperDiffAsk < firstBidRow) {
          newBidsArr = newBidsArr.slice(0, 1);
        } else {
          break;
        }
        // eslint-disable-next-line no-constant-condition
      } while (true);
      newGrouped.bids = new Map(newBidsArr);
    }
  }

  // b) if new bids are added, check if asks should be corrected
  if (groupsDiff.bids.created.length > 0) {
    const mostExpensiveDiffBids = Math.max(...groupsDiff.bids.created);

    let newAsksArr = mapToSortedArr(acc.grouped.asks);
    if (newAsksArr.length > 0) {
      do {
        if (newAsksArr.length === 0) {
          break;
        }
        const firstAskRow = at(newAsksArr, 0)[0];
        if (firstAskRow < mostExpensiveDiffBids) {
          newAsksArr = newAsksArr.slice(1);
        } else {
          break;
        }
        // eslint-disable-next-line no-constant-condition
      } while (true);
      newGrouped.asks = new Map(newAsksArr);
    }
  }
  return newGrouped;
};

const reducePendingGroupUpdatesToState = (
  pendingGroupUpdates: OrderbookGenericScopeDataType<OrdersMap>[],
  state: OrderbookStateType,
): OrderbookStateType => {
  const res = Array.from(pendingGroupUpdates).reduce(
    (acc: OrderbookStateType, updates) => {
      //    const t1 = Date.now();
      const groupedWithMinimumThresholdsApplied = {
        bids: applyMinimumThresholdsToGroups(
          acc.grouped.bids,
          state.groupBy,
          updates.bids,
        ),
        asks: applyMinimumThresholdsToGroups(
          acc.grouped.asks,
          state.groupBy,
          updates.asks,
        ),
      };

      const { grouped, newMainState } = reduceUpdatesToScopedStateForGrouped(
        updates,
        groupedWithMinimumThresholdsApplied,
        state.groupBy,
        acc,
      );

      const ret = {
        ...acc,
        ...reduceScopeWithFn(newMainState, wipeZeroRecords),
        grouped: reduceScopeWithFn(grouped, wipeZeroRecords),
      };

      return ret;
    },
    state,
  );

  // the "ensureConsistencyWithDiff" is to make sure some
  // rows are properly wiped (the API doesnt have a "snapshot" action,
  // therefore, some estimations are made, specially over the first
  // renders of the widget).

  return { ...res, grouped: ensureConsistencyWithDiff(state.grouped, res) };
};

const reduceStateToNewGroupBySetting = (
  state: OrderbookStateType,
  groupBy: number,
): OrderbookStateType => {
  const { newMainState, grouped } = reduceUpdatesToScopedStateForGrouped(
    {
      bids: state.bids,
      asks: state.asks,
    },
    { ...INITIAL_ORDERBOOK_STATE.grouped },
    groupBy,
    { bids: new Map(), asks: new Map() },
  );
  return {
    ...state,
    ...newMainState,
    groupBy,
    grouped,
    isLoading: true,
  };
};

export const orderBookReducer = (
  state: OrderbookStateType,
  action: OrderbookReducerAction,
): OrderbookStateType => {
  // console.log('[ *!* ] Executing action: <' + action.type + '>', state);
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload.value };
      break;

    case 'UPDATE_GROUPED':
      return {
        ...reducePendingGroupUpdatesToState(action.payload.updates, state),
        isLoading: false,
      };
      break;

    case 'SET_GROUP_BY':
      return reduceStateToNewGroupBySetting(state, action.payload.value);
      break;
    default:
      throw new Error('orderBook: unknown reducer: ' + action.type);
  }
};
