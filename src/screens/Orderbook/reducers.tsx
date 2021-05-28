/* eslint security/detect-object-injection:0 */

import {
  getNormalizedPrice,
  getGroupedPrice,
  immutableObjReplacingKey,
  reduceScopeWithFn,
  wipeZeroRecords,
  ob2arr,
  getAffectedPricesInUpdateList,
  getEstimatedMinimumSize,
} from './utils';

import type {
  OrderbookOrdersSortedObject,
  OrderbookGenericScopeDataType,
  OrderbookStateType,
  PendingGroupUpdateRecord,
  OrderbookActionUpdate,
  OrderbookReducerAction,
  WebSocketOrderbookUpdatesType,
} from './types';

import type {
  WebSocketOrderbookDataArray,
  WebSocketOrderbookSizePricePair,
} from '../../hooks/useWebSocket';

export const INITIAL_ORDERBOOK_STATE: OrderbookStateType = {
  groupBy: 100,
  bids: {},
  asks: {},
  grouped: { bids: {}, asks: {} },
  pendingGroupUpdates: [],
  groupKeysUpdated: { bids: {}, asks: {} },
  options: { disableTwoWayProcessing: false },
  isLoading: true,
};

export const reduceKeyPairToState = <
  T extends any[] = WebSocketOrderbookDataArray,
>(
  data: T,
  initialState: OrderbookOrdersSortedObject,
): OrderbookOrdersSortedObject => {
  /*console.log(
    '    reduceKeyPairToState: input: initialState=',
    initialState,
    'updates: ',
    data,
  );*/

  const res = data.reduce(
    (acc, [price, oSize]) =>
      immutableObjReplacingKey(acc, getNormalizedPrice(price), oSize),
    initialState,
  );
  // console.log('    reduceKeyPairToState: output:', res);
  return res;
};

export const mutateForGrouping = (
  updates: WebSocketOrderbookDataArray,
  groupBy: number,
  inputLastKnownExactValues: OrderbookOrdersSortedObject,
  initialState: OrderbookOrdersSortedObject,
): [WebSocketOrderbookDataArray, OrderbookOrdersSortedObject] => {
  if (updates.length === 0) {
    return [ob2arr(initialState), inputLastKnownExactValues];
  }
  /* console.log();
  console.log();
  console.log(
    '***** mutateForGrouping STARTS',
    'updates:',
    JSON.stringify(updates),

    'last exact known values=',
    inputLastKnownExactValues,
    'initial state=',
    initialState,
  );*/

  const initialAcc = initialState; //array2ob(initialReducerState);

  const r1 = updates.reduce(
    (accR, [price, v]) => {
      const { acc, lastKnownExactValues } = accR;

      const normalizedExactPrice = getNormalizedPrice(price);
      const groupedPrice = getGroupedPrice(price, groupBy);
      const usePrice = getNormalizedPrice(groupedPrice); // getNormalizedGroupedPrice(price, groupBy);

      const oldExactPriceSizeIsKnown =
        normalizedExactPrice in lastKnownExactValues;

      const oldSizeForExact = oldExactPriceSizeIsKnown
        ? lastKnownExactValues[normalizedExactPrice]
        : undefined;

      const exactDiff = !oldExactPriceSizeIsKnown
        ? v
        : -1 * ((oldSizeForExact || 0) - v);

      const oldGroupSize = acc[usePrice] || 0;

      /*   console.log('');
      console.log(
        '[***] Starts function: process: ',
        {
          in: { price, v },
        },
        {
          exact: { old: oldSizeForExact, diff: exactDiff },
        },
        { group: { old: oldGroupSize } },
      );*/

      if (oldGroupSize > 0) {
        if (exactDiff !== 0) {
          const sumB = oldGroupSize + exactDiff;

          if (sumB >= 0) {
            return {
              acc: { ...acc, [usePrice]: sumB },
              lastKnownExactValues: {
                ...lastKnownExactValues,
                [normalizedExactPrice]: v,
              },
            };
          }
        }
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
  /*
  console.log('RESULT OF NEW EXACT VALUES: ', r1.lastKnownExactValues);
  console.log('EXACT VALUES ORIG WAS: : ', inputLastKnownExactValues);
  console.log('RESULT: ', r2);
  console.log(); */
  return [ob2arr(r1.acc), r1.lastKnownExactValues];
};

const mutateScopeForGrouping = (
  updates: OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>,
  groupBy: number,
  oldExactRootState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
  initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
): {
  newMainState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>;
  groupedMutatedData: OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>;
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
  updates: OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>,
  initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
): OrderbookGenericScopeDataType<OrderbookOrdersSortedObject> => ({
  bids: reduceKeyPairToState(updates.bids, initialState.bids),
  asks: reduceKeyPairToState(updates.asks, initialState.asks),
});

const getUpdatedActivityTimes = (
  data: WebSocketOrderbookSizePricePair[],
  initialGroupKeysUpdated: OrderbookOrdersSortedObject,
  initialState: OrderbookOrdersSortedObject,
) =>
  getAffectedPricesInUpdateList(data).reduce((acc, normalizedPrice) => {
    // eslint-disable-next-line unicorn/prefer-array-find
    const last = data.filter(
      (d) => d[0] === parseFloat(normalizedPrice) / Math.pow(10, 2),
    )[0][1];

    return last !== initialState[normalizedPrice]
      ? { ...acc, [normalizedPrice]: Date.now() }
      : acc;
  }, initialGroupKeysUpdated);

const reduceUpdatesToScopedStateForGrouped = (
  updates: OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>,
  initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
  groupBy: number,
  oldExactRootState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
  initialGroupKeysUpdated: OrderbookGenericScopeDataType<
    Record<string, number>
  >,
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

  const groupKeysUpdated = {
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
  };

  // console.log('GKU:', groupKeysUpdated);

  return {
    newMainState,
    grouped: returnValue,
    groupKeysUpdated,
  };
};

const applyMinimumThresholdsToGroups = (
  groups: OrderbookOrdersSortedObject,
  groupBy: number,
  updates: WebSocketOrderbookDataArray,
) => {
  if (updates.length === 0) {
    //  console.log('applyMinimumThresholdsToGroups: updates.length = 0');
    return groups;
  }

  const groupMins = updates.reduce(
    (
      acc,
      [
        exactPriceInFloat,
        absoluteSizeInUpdate,
      ]: WebSocketOrderbookSizePricePair,
    ) => {
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
      const groupedPrice = parseFloat(normalizedGroupedPrice) / Math.pow(10, 2);
      const minimumSizeForGroup = getEstimatedMinimumSize(
        groups,
        groupedPrice,
        groupBy,
      );
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

  // console.log('applyMinimumThresholdsToGroups R1 is: ', r1);

  return r1;
};

const reducePendingGroupUpdatesToState = (
  pendingGroupUpdates: PendingGroupUpdateRecord[],
  state: OrderbookStateType,
): OrderbookStateType => {
  const initialGroupKeysUpdated = { asks: {}, bids: {} };

  const res = pendingGroupUpdates.reduce(
    (acc: OrderbookStateType, { updates }) => {
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

      const { grouped, newMainState, groupKeysUpdated } =
        reduceUpdatesToScopedStateForGrouped(
          updates,
          groupedWithMinimumThresholdsApplied,
          state.groupBy,
          acc,
          {
            asks: {
              ...initialGroupKeysUpdated.asks,
              ...acc.groupKeysUpdated.asks,
            },
            bids: {
              ...initialGroupKeysUpdated.bids,
              ...acc.groupKeysUpdated.bids,
            },
          },
        );

      return {
        ...acc,
        ...reduceScopeWithFn(newMainState, wipeZeroRecords),
        grouped: reduceScopeWithFn(grouped, wipeZeroRecords),
        groupKeysUpdated,
      };
    },
    state,
  );

  const expiredBids = Object.entries(state.groupKeysUpdated.bids)
    .map(([p, t]) => (t && Date.now() - t > 5000 ? p : undefined))
    .filter((x) => x);

  const expiredAsks = Object.entries(state.groupKeysUpdated.asks)
    .map(([p, t]) => (t && Date.now() - t > 5000 ? p : undefined))
    .filter((x) => x);

  const nres = {
    ...res,
    grouped: {
      ...res.grouped,
      bids: Object.entries(res.grouped.bids).reduce((acc, [currK, currV]) => {
        // eslint-disable-next-line unicorn/prefer-includes
        return expiredBids.indexOf(currK) >= 0
          ? acc
          : { ...acc, [currK]: currV };
      }, {}),
      asks: Object.entries(res.grouped.asks).reduce((acc, [currK, currV]) => {
        // eslint-disable-next-line unicorn/prefer-includes
        return expiredAsks.indexOf(currK) >= 0
          ? acc
          : { ...acc, [currK]: currV };
      }, {}),
    },
  };

  //console.log('nres.groupKeysUpdated: ', nres.groupKeysUpdated);

  const nres2 = {
    ...nres,
    groupKeysUpdated: {
      bids: Object.entries(res.groupKeysUpdated.bids)
        .filter((gb) => {
          // eslint-disable-next-line unicorn/prefer-includes
          return expiredBids.indexOf(gb[0]) === -1;
        })
        .reduce((ac, [ck, cv]) => {
          return { ...ac, [ck]: cv };
        }, {}),
      asks: Object.entries(res.groupKeysUpdated.asks)
        .filter((gb) => {
          // eslint-disable-next-line unicorn/prefer-includes
          return expiredAsks.indexOf(gb[0]) === -1;
        })
        .reduce((ac, [ck, cv]) => {
          return { ...ac, [ck]: cv };
        }, {}),
    },
  };

  //console.log('nres2.groupKeysUpdated: ', nres2.groupKeysUpdated);

  return nres2;
};

const reduceNewTasksToQueue = (
  state: OrderbookStateType,
  updates: WebSocketOrderbookUpdatesType,
): OrderbookStateType => ({
  ...state,
  pendingGroupUpdates: [
    ...state.pendingGroupUpdates,
    {
      kind: 'u' as OrderbookActionUpdate,
      updates: { ...updates },
    },
  ],
});

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
    {},
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
    /*
    case 'CALCULATE_GROUPED':
      return state.options.disableTwoWayProcessing === false
        ? reducePendingGroupUpdatesToState(state.pendingGroupUpdates, state)
        : { ...state };
      break;
*/
    case 'UPDATE_GROUPED':
      return {
        ...reducePendingGroupUpdatesToState(action.payload.updates, state),
        isLoading: false,
      };
      break;
    /*
    case 'ORDERBOOK_SNAPSHOT':
    case 'ORDERBOOK_UPDATE':
      return state.options.disableTwoWayProcessing === false
        ? reduceNewTasksToQueue(state, action.payload.updates)
        : reducePendingGroupUpdatesToState(
            reduceNewTasksToQueue(state, action.payload.updates),
          );

      break;
*/
    case 'SET_GROUP_BY':
      return reduceStateToNewGroupBySetting(state, action.payload.value);
      break;
    default:
      throw new Error('orderBook: unknown reducer: ' + action.type);
  }
};
