/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                               *
 *                    | react-native-orderbook |                 *
 *                                                               *
 *  License |  MIT General Public License                        *
 *  Author  |  Jorge Duarte Rodríguez <info@malagadev.com>       *
 *                                                               *
 *                            (c) 2021                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
import {
  getNormalizedPrice,
  getGroupedPrice,
  getPrintPriceForNormalizedPrice,
  immutableObjReplacingKey as immutableObjectReplacingKey,
  wrapWithLogName,
} from './utils';

import type {
  OrderbookNormalizedPrice,
  OrderbookOrdersSortedObject,
  OrderbookGenericScopeDataType,
  GenericMutatingFunctionType,
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
  groupBy: 50,
  bids: {},
  asks: {},
  grouped: { bids: {}, asks: {} },
  pendingGroupUpdates: [],
};

export const uniq = <T extends unknown = any>(array: T[]): T[] => [
  ...new Set(array),
];

export const getNormalizedGroupedPrice = (
  price: number,
  groupBy: number,
  decimals = 2,
): OrderbookNormalizedPrice =>
  getNormalizedPrice(getGroupedPrice(price, groupBy), decimals);

export const customFormatNumberToFloat = (price: string): number =>
  Number.parseInt(price) / 100;

export const getAffectedPricesInUpdateList = (
  array: WebSocketOrderbookSizePricePair[],
): OrderbookNormalizedPrice[] =>
  uniq<OrderbookNormalizedPrice>(
    array.map(([price]: WebSocketOrderbookSizePricePair) =>
      getNormalizedPrice(price),
    ),
  );

export const reduceKeyPairToState = <
  T extends any[] = WebSocketOrderbookDataArray,
>(
  data: T,
  initialState: OrderbookOrdersSortedObject,
  mutatingKeyFunction: GenericMutatingFunctionType = immutableObjectReplacingKey as GenericMutatingFunctionType,
): OrderbookOrdersSortedObject => {
  console.log('reduceKeyPairToState: input:', { data, initialState });
  const res = data.reduce(
    (accumulator, [price, oSize]) =>
      mutatingKeyFunction(accumulator, getNormalizedPrice(price), oSize),
    initialState,
  );
  console.log('reduceKeyPairToState: output:', res);
  return res;
};

const immutableObjectReplacingKeyWithSum = <
  V extends number = number,
  O extends Record<string, V> = Record<string, V>,
>(
  object: O,
  key: string,
  delta: V,
  kDebugType = '*',
): O => {
  const existingValue = key in object ? object[key] : undefined;

  if (existingValue === undefined) {
    return { ...object };
  }

  const newValue = existingValue + delta;

  if (delta === 0) {
    return { ...object }; //immutableObjWithoutKeyIfExists<O>(obj, key);
  }

  if (!newValue) {
    console.log(
      'immutableObjReplacingKeyWithSum(' +
        kDebugType +
        '): should be DELETING <' +
        getPrintPriceForNormalizedPrice(key) +
        '> PRIMO?',
      {
        delta,
        existingValue,
        newVal: newValue,
        obj: object,
      },
    );
    //  return immutableObjWithoutKeyIfExists<O>(obj, key, 'immutableObjReplacingKeyWithSum/0/' + key);
  }
  /*console.log(
    '     replace(<' +
      key +
      '>.' +
      kDebugType +
      '): from ' +
      existingValue +
      ' ->  ( + ' +
      delta +
      ') -> to ' +
      newVal +
      '>',
    //   obj,
  );
*/
  return { ...object, [key]: newValue };
};
//{"data": [[37900, 132127], [37900, 0]], "initialState": {}}

const mutateForGrouping = <T extends any[] = WebSocketOrderbookDataArray>(
  updates: T,
  groupBy: number,
  lastExactRootState: OrderbookOrdersSortedObject,
  initialReducerState = [],
): T => {
  const r1 = updates.reduce((accumulator, [price, value], drIndex) => {
    const normalizedExactPrice = getNormalizedPrice(price);
    const usePrice = getNormalizedGroupedPrice(price, groupBy);
    const oldSizeForExact =
      normalizedExactPrice in lastExactRootState
        ? lastExactRootState[normalizedExactPrice]
        : 0;

    const diff = oldSizeForExact - value;
    const oldSize = usePrice in accumulator ? accumulator[usePrice] : 0;

    const newValue = oldSize - diff;

    /*
    if (newVal == 0) {
      return acc;
    }
    */

    return [...accumulator, [getGroupedPrice(price, groupBy), newValue]];
  }, initialReducerState);

  //console.log({ r1 });
  return r1;
  /*  const r2 = r1.reduce((acc, curr) => immutableObjReplacingKeyWithSum(acc, curr[0], curr[1]), {});

  //console.log({ r2 });
  const r3 = ob2arr(r2);
  // console.log('    *** *** *** *** *** *** '); //{ r1, r3 });
  return r3;
*/
};

const mutateScopeForGrouping = (
  updates: OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>,
  groupBy: number,
  lastExactRootState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
  // initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
): OrderbookGenericScopeDataType<WebSocketOrderbookDataArray> => {
  const bids = mutateForGrouping(
    updates.bids,
    groupBy,
    lastExactRootState.bids,
    [], // ob2arr(initialState.bids),
  );

  const asks = mutateForGrouping(
    updates.asks,
    groupBy,
    lastExactRootState.asks,
    [], //ob2arr(initialState.asks),
  );
  /* console.log();
  console.log('    mutateScopeForGrouping: ', 'bids:', bids, 'asks:', asks);
  console.log();
  */ return {
    bids,
    asks,
  };
};

const getStateSelection = <
  S extends Record<any, any> = Record<any, any>,
  KN extends string = string,
>(
  keyNames: KN[],
  state: S,
): OrderbookOrdersSortedObject => {
  return keyNames.reduce((accumulator, current) => {
    return !state[current]
      ? { ...accumulator }
      : { ...accumulator, [current]: state[current] };
  }, {});
};

const getSelectedKeysForUpdates = (
  updates: WebSocketOrderbookUpdatesType,
  state: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
): OrderbookGenericScopeDataType<OrderbookOrdersSortedObject> => {
  return {
    bids: getStateSelection<
      OrderbookOrdersSortedObject,
      OrderbookNormalizedPrice
    >(getAffectedPricesInUpdateList(updates.bids), state.bids),
    asks: getStateSelection<
      OrderbookOrdersSortedObject,
      OrderbookNormalizedPrice
    >(getAffectedPricesInUpdateList(updates.asks), state.asks),
  };
};

const reduceUpdatesToScopedState = (
  updates: OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>,
  initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
  mutatingKeyFunction: GenericMutatingFunctionType = immutableObjectReplacingKey as GenericMutatingFunctionType,
): OrderbookGenericScopeDataType<OrderbookOrdersSortedObject> => ({
  bids: reduceKeyPairToState(
    updates.bids,
    initialState.bids,
    wrapWithLogName(mutatingKeyFunction, 'g.bids'),
  ),
  asks: reduceKeyPairToState(
    updates.asks,
    initialState.asks,
    wrapWithLogName(mutatingKeyFunction, 'g.asks'),
  ),
});

const reduceUpdatesToScopedStateForGrouped = (
  updates: OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>,
  initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
  groupBy: number,
  lastExactRootState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
) => {
  const mutatedData = mutateScopeForGrouping(
    updates,
    groupBy,
    lastExactRootState /*, initialState*/,
  );

  console.log('mutatedData:', mutatedData);

  /*  console.log('[G] ', {
    initialState,
    mutatedData: JSON.stringify(mutatedData),
  });
*/
  const returnValue = reduceUpdatesToScopedState(
    mutatedData,
    initialState, // { asks: {}, bids: {} },
    immutableObjectReplacingKeyWithSum as GenericMutatingFunctionType,
  );
  console.log('`-> ret is:', returnValue);
  return returnValue;
};
/*
const combineLastStates = <T extends OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>>(
  a: T,
  b: T,
): T => {
  return {
    bids: { ...a.bids, ...b.bids },
    asks: { ...a.asks, ...b.asks },
  };
};
*/
const reducePendingGroupUpdatesToState = (
  state: OrderbookStateType,
): OrderbookStateType => {
  /*
 LOG  nsp reducer, acc is:  [{"asks": {"3765750": 2500, "3765800": 2006, "3766350": 195666, "3766950": 5212, "3767000": 76351, "3767050": 3751, "3767200": 3382, "3767350": 20100, "3767650": 150000, "3768050": 150000, "3768100": 27001, "3768450": 3546, "3768500": 5574, "3768550": 257976, "3768600": 15000, "3768800": 151, "3768900": 20000, "3769100": 3732, "3769150": 20000, "3769350": 150000, "3770000": 32942, "3770150": 274388, "3770700": 22891, "3770750": 376, "3770900": 347850}, "bids": {"3755750": 32942, "3756300": 19480, "3756500": 240000, "3756700": 20000, "3756800": 20000, "3757500": 204545, "3757550": 1226, "3758300": 121378, "3758500": 104687, "3758950": 20000, "3759100": 20000, "3759300": 150000, "3759350": 12362, "3759400": 9920, "3759700": 40100, "3759750": 61044, "3760350": 9167, "3760400": 8039, "3760800": 10000, "3761000": 19950, "3761100": 3865, "3761250": 4261, "3761400": 1153, "3761450": 1153, "3761500": 4592}, "grouped": {"asks": [Object], "bids": [Object]}}]
*/
  const res = state.pendingGroupUpdates.reduce(
    (
      accumulator: Partial<OrderbookStateType>,
      { updates, selectedLastState }: PendingGroupUpdateRecord,
      uIndex: number,
    ) => {
      // console.log('nsp reducer, acc is: ', acc);
      // const lastAcc = acc.length > 0 ? acc[acc.length - 1] : null;
      // if (acc.length > -1) {
      const { bids, asks } = reduceUpdatesToScopedState(
        updates,
        selectedLastState,
      );
      //   }
      /* const st2 = getSelectedKeysForUpdates(updates, newScopeState);
      console.log(st2);

      const updatedSelectedLastState = combineLastStates<
        OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>
      >(st2, selectedLastState);

      console.log('  [+] updatedSelectedLastState: ', updatedSelectedLastState);
*/
      const grouped = reduceUpdatesToScopedStateForGrouped(
        updates,
        accumulator.grouped || { ...INITIAL_ORDERBOOK_STATE.grouped },
        state.groupBy,
        selectedLastState,
      );
      //  console.log('   [CALCULATE_GROUPED:' + uIdx.toString() + ']  finishes: ', grouped);

      return { ...accumulator, bids, asks, grouped };
    },
    {
      ...state,
      pendingGroupUpdates: [],
    },
  ) as OrderbookStateType;
  console.log('STATE IS:', res);
  return res;
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
      updates,
      selectedLastState: getSelectedKeysForUpdates(updates, state),
    },
  ],
});

export const orderBookReducer = (
  state: OrderbookStateType,
  action: OrderbookReducerAction,
): OrderbookStateType => {
  //console.log('[ *!* ] Executing action: <' + action.type + '>');
  switch (action.type) {
    case 'CALCULATE_GROUPED':
      return reducePendingGroupUpdatesToState(state);
      break;

    case 'ORDERBOOK_SNAPSHOT':
    case 'ORDERBOOK_UPDATE':
      //  console.log('ORDERBOOK_UPDATE triggered: ', action.payload);
      return reduceNewTasksToQueue(state, action.payload.updates);

      break;

    case 'SET_GROUP_BY':
      console.log('SET_GROUP_BY');
      return state;
      /*  return {
        ...state,
        groupBy: action.payload.value,
        grouped: reduceUpdatesToScopedStateForGrouped(
          { bids: Object.entries(state.bids), asks: Object.entries(state.asks) },
          { ...INITIAL_ORDERBOOK_STATE.grouped },
          action.payload.value,
          { bids: {}, asks: {} },
        ),
      };*/
      break;
    default:
      throw new Error('orderBook: unknown reducer: ' + action.type);
  }
};

const ob2array = (
  input: OrderbookOrdersSortedObject,
  initialState = [],
): WebSocketOrderbookDataArray =>
  Object.entries(input).reduce(
    (accumulator: WebSocketOrderbookDataArray, [currentK, currentV]) => [
      ...accumulator,
      [customFormatNumberToFloat(currentK), currentV],
    ],
    initialState,
  );
