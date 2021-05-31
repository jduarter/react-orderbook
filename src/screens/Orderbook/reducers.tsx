/* eslint security/detect-object-injection:0 */

import at from 'array.prototype.at';

import {
  getNormalizedPrice,
  getGroupedPrice,
  immutableObjReplacingKey,
  reduceScopeWithFn,
  wipeZeroRecords,
  ob2arr,
  getAffectedPricesInUpdateList,
  getEstimatedMinimumSize,
  arr2obj,
  exactPriceIsWithinGroupPrice,
} from './utils';

import type {
  OrderbookOrdersSortedObject,
  OrderbookGenericScopeDataType,
  OrderbookStateType,
  PendingGroupUpdateRecord,
  OrderbookReducerAction,
  WSDataPriceSizePair,
} from './types';

export const INITIAL_ORDERBOOK_STATE: OrderbookStateType = {
  groupBy: 100,
  bids: {},
  asks: {},
  grouped: { bids: {}, asks: {} },
  pendingGroupUpdates: [],
  groupKeysUpdated: { bids: {}, asks: {} },
  isLoading: true,
};

export const reduceKeyPairToState = <T extends any[] = WSDataPriceSizePair[]>(
  data: T,
  initialState: OrderbookOrdersSortedObject,
): OrderbookOrdersSortedObject =>
  data.reduce(
    (acc, [price, oSize]) =>
      immutableObjReplacingKey(acc, getNormalizedPrice(price), oSize),
    initialState,
  );

export const mutateForGrouping = (
  updates: WSDataPriceSizePair[],
  groupBy: number,
  inputLastKnownExactValues: OrderbookOrdersSortedObject,
  initialState: OrderbookOrdersSortedObject,
): [WSDataPriceSizePair[], OrderbookOrdersSortedObject] => {
  if (updates.length === 0) {
    return [ob2arr(initialState), inputLastKnownExactValues];
  }

  const initialAcc = initialState;

  const r1 = updates.reduce(
    (accR, [price, v]) => {
      const { acc, lastKnownExactValues } = accR;

      const normalizedExactPrice = getNormalizedPrice(price);
      const groupedPrice = getGroupedPrice(price, groupBy);
      const usePrice = getNormalizedPrice(groupedPrice);

      const oldExactPriceSizeIsKnown =
        normalizedExactPrice in lastKnownExactValues;

      const oldSizeForExact = oldExactPriceSizeIsKnown
        ? lastKnownExactValues[normalizedExactPrice]
        : undefined;

      const exactDiff = !oldExactPriceSizeIsKnown
        ? v
        : -1 * ((oldSizeForExact || 0) - v);

      const oldGroupSize = acc[usePrice] || 0;
      const sumB = oldGroupSize + exactDiff;

      if (
        oldGroupSize > 0 &&
        exactDiff !== 0 &&
        typeof sumB !== 'undefined' &&
        sumB >= 0
      ) {
        return {
          acc: { ...acc, [usePrice]: sumB },
          lastKnownExactValues: {
            ...lastKnownExactValues,
            [normalizedExactPrice]: v,
          },
        };
      }
      return {
        acc: { ...acc },
        lastKnownExactValues: {
          ...lastKnownExactValues,
          [normalizedExactPrice]: v,
        },
      };
    },
    { acc: initialAcc, lastKnownExactValues: inputLastKnownExactValues },
  );

  return [ob2arr(r1.acc), r1.lastKnownExactValues];
};

const mutateScopeForGrouping = (
  updates: OrderbookGenericScopeDataType<WSDataPriceSizePair[]>,
  groupBy: number,
  oldExactRootState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
  initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
): {
  newMainState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>;
  groupedMutatedData: OrderbookGenericScopeDataType<WSDataPriceSizePair[]>;
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
  updates: OrderbookGenericScopeDataType<WSDataPriceSizePair[]>,
  initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
): OrderbookGenericScopeDataType<OrderbookOrdersSortedObject> => ({
  bids: reduceKeyPairToState(updates.bids, initialState.bids),
  asks: reduceKeyPairToState(updates.asks, initialState.asks),
});

const getUpdatedActivityTimes = (
  data: WSDataPriceSizePair[],
  initialGroupKeysUpdated: OrderbookOrdersSortedObject,
  initialState: OrderbookOrdersSortedObject,
) =>
  getAffectedPricesInUpdateList(data).reduce((acc, normalizedPrice) => {
    const last = data.filter(
      (d) => d[0] === convertSpecialObjKeyToFloat(normalizedPrice),
    )[0][1];

    return last !== initialState[normalizedPrice]
      ? { ...acc, [normalizedPrice]: Date.now() }
      : acc;
  }, initialGroupKeysUpdated);

const reduceUpdatesToScopedStateForGrouped = (
  updates: OrderbookGenericScopeDataType<WSDataPriceSizePair[]>,
  initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
  groupBy: number,
  oldExactRootState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
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

  /*  const groupKeysUpdated = {
    asks: getUpdatedActivityTimes(
      groupedMutatedData.asks,
      initialGroupKeysUpdated.asks,
      initialState.asks,
    ),
    bids: getUpdatedActivityTimes(
      groupedMutatedData.bids,
      initialGroupKeysUpdated.bids,
      initialState.bids,
    ),
  };*/

  return {
    newMainState,
    grouped: returnValue,
    // groupKeysUpdated,
  };
};

/**/

const applyMinimumThresholdsToGroups = (
  groups: OrderbookOrdersSortedObject,
  groupBy: number,
  updates: WSDataPriceSizePair[],
) => {
  if (updates.length === 0) {
    return groups;
  }

  const groupMins = updates.reduce(
    (acc, [exactPriceInFloat, absoluteSizeInUpdate]: WSDataPriceSizePair) => {
      const groupedPrice = getGroupedPrice(exactPriceInFloat, groupBy);
      const normalizedGroupPrice = getNormalizedPrice(groupedPrice);

      return {
        ...acc,
        [normalizedGroupPrice]: absoluteSizeInUpdate,
      };
    },
    groups,
  );

  const r1 = Object.entries(groupMins).reduce(
    (acc, [normalizedGroupedPrice, calcSumSizeForUpdates]) => {
      //  const groupedPrice = convertSpecialObjKeyToFloat(normalizedGroupedPrice);

      const minimumSizeForGroup = groups[normalizedGroupedPrice];

      /* const minimumSizeForGroup = getEstimatedMinimumSize(
        groups,
        groupedPrice,
        groupBy,
      );*/

      const newGroupSize =
        minimumSizeForGroup > calcSumSizeForUpdates
          ? minimumSizeForGroup
          : calcSumSizeForUpdates;

      if (newGroupSize === 0) {
        return { ...acc };
      }

      return {
        ...acc,
        [normalizedGroupedPrice]: newGroupSize,
      };
    },
    {},
  );

  // console.log('applyMinimumThresholdsToGroups: ', r1);

  return r1;
};

const getAffectedPricesInUpdateListForObj = (
  subgroup: OrderbookOrdersSortedObject,
): string[] => getAffectedPricesInUpdateList(ob2arr(subgroup));

const sortedObjValueSymDiff = (
  a: OrderbookOrdersSortedObject,
  b: OrderbookOrdersSortedObject,
): number[] => {
  const aa = Object.values(a);
  const ab = Object.values(b);

  return aa
    .filter((x) => !ab.includes(x))
    .concat(ab.filter((x) => !aa.includes(x)));
};

const calculateDiff = (
  before: string[],
  after: string[],
): { created: string[]; removed: string[] } => ({
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
  before: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
  after: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
): OrderbookGenericScopeDataType<{ created: string[]; removed: string[] }> => {
  const a = reduceScopeWithFn<OrderbookOrdersSortedObject, string[]>(
    before,
    getAffectedPricesInUpdateListForObj,
  );

  const b = reduceScopeWithFn<OrderbookOrdersSortedObject, string[]>(
    after,
    getAffectedPricesInUpdateListForObj,
  );

  const changedKeys = reduceTwoScopesWithFn<
    OrderbookOrdersSortedObject,
    string[],
    string[]
  >(a, b, sortedObjValueSymDiff);

  const beforeKeys = reduceScopeWithFn<OrderbookOrdersSortedObject, string[]>(
    before,
    Object.keys,
  );

  const diff = reduceTwoScopesWithFn(beforeKeys, changedKeys, calculateDiff); //calculateDiff(cmp1, ret);

  return diff;
};

const convertSpecialObjKeyToFloat = (x: string) =>
  parseFloat(x) / Math.pow(10, 2);

const ensureConsistencyWithDiff = (
  grouped: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
  acc: OrderbookStateType,
): OrderbookGenericScopeDataType<OrderbookOrdersSortedObject> => {
  const newGrouped = { ...acc.grouped };

  const groupsDiff = getGroupMembersDiff(grouped, acc.grouped);

  // b) if new asks are added, check if bids should be corrected
  if (groupsDiff.asks.created.length > 0) {
    const cheaperDiffAsk = Math.min(
      ...groupsDiff.asks.created.map((x) => convertSpecialObjKeyToFloat(x)),
    );

    let newBidsArr = ob2arr(acc.grouped.bids);
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
      newGrouped.bids = arr2obj(newBidsArr);
    }
  }

  // b) if new bids are added, check if asks should be corrected
  if (groupsDiff.bids.created.length > 0) {
    const mostExpensiveDiffBids = Math.max(
      ...groupsDiff.bids.created.map((x) => convertSpecialObjKeyToFloat(x)),
    );

    let newAsksArr = ob2arr(acc.grouped.asks);
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
      newGrouped.asks = arr2obj(newAsksArr);
    }
  }
  return newGrouped;
};

const reducePendingGroupUpdatesToState = (
  pendingGroupUpdates: PendingGroupUpdateRecord[],
  state: OrderbookStateType,
): OrderbookStateType => {
  //  const initialGroupKeysUpdated = { asks: {}, bids: {} };

  const res = pendingGroupUpdates.reduce((acc: OrderbookStateType, updates) => {
    const t1 = Date.now();
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
    const t2 = Date.now();
    const { grouped, newMainState /* groupKeysUpdated*/ } =
      reduceUpdatesToScopedStateForGrouped(
        updates,
        groupedWithMinimumThresholdsApplied,
        state.groupBy,
        acc,
        {
          asks: {
            //    ...initialGroupKeysUpdated.asks,
            ...acc.groupKeysUpdated.asks,
          },
          bids: {
            //         ...initialGroupKeysUpdated.bids,
            ...acc.groupKeysUpdated.bids,
          },
        },
      );
    const t3 = Date.now();
    const ret = {
      ...acc,
      ...reduceScopeWithFn(newMainState, wipeZeroRecords),
      grouped: reduceScopeWithFn(grouped, wipeZeroRecords),
      //   groupKeysUpdated,
    };
    const t4 = Date.now();
    console.log(
      'PGU UPDATE total: ',
      ((t4 - t1) / 1000).toPrecision(4) + ' secs',
      {
        x: ((t2 - t1) / 1000).toPrecision(4),
        y: ((t3 - t2) / 1000).toPrecision(4),
        z: ((t4 - t3) / 1000).toPrecision(4),
      },
    );
    return ret;
  }, state);

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
      bids: ob2arr(state.bids),
      asks: ob2arr(state.asks),
    },
    { ...INITIAL_ORDERBOOK_STATE.grouped },
    groupBy,
    { bids: {}, asks: {} },
    { bids: {}, asks: {} },
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
      const t1 = Date.now();
      const ret = {
        ...reducePendingGroupUpdatesToState(action.payload.updates, state),
        isLoading: false,
      };
      const t2 = Date.now();
      console.log(
        '  + processing took: ',
        ((t2 - t1) / 1000).toPrecision(4) + ' secs',
      );
      return ret;
      break;

    case 'SET_GROUP_BY':
      return reduceStateToNewGroupBySetting(state, action.payload.value);
      break;
    default:
      throw new Error('orderBook: unknown reducer: ' + action.type);
  }
};
