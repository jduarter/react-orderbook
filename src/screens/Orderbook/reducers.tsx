/* eslint security/detect-object-injection:0 */

import { Decimal } from 'decimal.js';

import { scope } from './utils';

import { scopeElementsWithoutZeroRecords } from './reducers/common';
import { reduceUpdatesToScopedStateForGrouped } from './reducers/grouping';

import type {
  OrderbookStateType,
  OrderbookReducerAction,
  ExchangeModule,
  PendingGroupUpdateRecord,
  OrdersMap,
  UnprocessedRecord,
  UnprocessedData,
  NormalizedRecord,
  NormalizedData,
} from './types';

export const INITIAL_ORDERBOOK_STATE: OrderbookStateType = {
  ...scope(new Map(), new Map()),
  groupBy: 0,
  minGroupBy: 0,
  rowsPerSection: 5,
  grouped: scope(new Map(), new Map()),
  viewport: scope<NormalizedData>([], []),
  isLoading: true,
};

const getTotalForRow = (
  rows: UnprocessedData,
  index: number,
  orderBy: 'asc' | 'desc',
): Decimal =>
  rows.reduce(
    (acc: Decimal, current, ridx: number) =>
      acc.add(
        (orderBy === 'asc' ? ridx >= index : index >= ridx) ? current[1] : 0,
      ),
    new Decimal(0),
  );

const immutableGetReversedArr = <
  T extends [unknown, unknown] = UnprocessedRecord,
>(
  array: T[],
): T[] => {
  const copy = [...array];
  copy.reverse();
  return copy;
};

const splice = (str: string, offset: number, text: string): string => {
  let calculatedOffset = offset < 0 ? str.length + offset : offset;
  return (
    str.substring(0, calculatedOffset) + text + str.substring(calculatedOffset)
  );
};

const decimalFormat = (optimalInt: number, decimals: number = 2) => {
  return splice(optimalInt.toString(), -decimals, '.');
};

export const orderAndLimit = (
  map: OrdersMap,
  limit = 10,
  orderBy: 'asc' | 'desc' = 'asc',
): NormalizedData => {
  const array = [...map].sort((a, b) => a[0] - b[0]);

  const sorted =
    orderBy === 'desc' ? array.slice(0, limit) : array.slice(-limit);

  const result = immutableGetReversedArr(sorted);

  const maxTotal = Math.max(...result.map((e) => e[1].toNumber()));
  /*
  to consider the max total as dividend instead of using the bigger order:

  getTotalForRow(
    result,
    orderBy === 'desc' ? 0 : result.length - 1,
    orderBy === 'asc' ? 'desc' : 'asc',
  ); */

  const r = result.map((elem, index) => {
    const total = getTotalForRow(
      result,
      index,
      orderBy === 'asc' ? 'desc' : 'asc',
    );

    return [
      decimalFormat(elem[0], 2),
      elem[1],
      total,
      elem[1].div(maxTotal).toNumber(),
    ] as NormalizedRecord;
  });

  return r;
};

export const reducePendingGroupUpdatesToState = (
  pendingGroupUpdate: PendingGroupUpdateRecord,
  state: OrderbookStateType,
): OrderbookStateType => {
  const { bids, asks, grouped, ...restOfAcc } = state;

  const newState = reduceUpdatesToScopedStateForGrouped(
    pendingGroupUpdate.updates,
    grouped,
    state.groupBy,
    scope(bids, asks),
  );

  const newGrouped = scopeElementsWithoutZeroRecords(newState.grouped);

  return {
    ...restOfAcc,
    ...scopeElementsWithoutZeroRecords(newState),
    grouped: newGrouped,
    viewport: {
      asks: orderAndLimit(newGrouped.asks, state.rowsPerSection, 'desc'),
      bids: orderAndLimit(newGrouped.bids, state.rowsPerSection, 'asc'),
    },
  };
};

const reduceStateToNewGroupBySetting = (
  state: OrderbookStateType,
  groupBy: number,
  minGroupBy: number,
): OrderbookStateType => {
  const emptyGrouped = { ...INITIAL_ORDERBOOK_STATE.grouped };

  const { grouped } = reduceUpdatesToScopedStateForGrouped(
    scope(state.bids, state.asks),
    emptyGrouped,
    groupBy,
    scope(new Map(), new Map()),
  );

  return { ...state, groupBy, minGroupBy, grouped };
};

export const orderBookReducer =
  (exchangeModule: ExchangeModule) =>
  (
    state: OrderbookStateType,
    action: OrderbookReducerAction,
  ): OrderbookStateType => {
    if (
      exchangeModule?.mainReducerOverrides &&
      action.type in exchangeModule.mainReducerOverrides
    ) {
      return exchangeModule.mainReducerOverrides[action.type](state, action);
    }

    switch (action.type) {
      case 'RESET_STATE':
        return {
          ...INITIAL_ORDERBOOK_STATE,
          groupBy: exchangeModule.defaultOptions.groupBy,
          minGroupBy:
            exchangeModule.defaultOptions.defaultProduct.groupByFactors[0],
        };

      case 'SET_LOADING':
        return { ...state, isLoading: action.payload.value };

      case 'UPDATE_GROUPED':
        return action.payload.updates.reduce(
          (acc: OrderbookStateType, curr: PendingGroupUpdateRecord) => ({
            ...acc,
            ...reducePendingGroupUpdatesToState(curr, state),
          }),
          { isLoading: false },
        );

      case 'SET_GROUP_BY':
        return {
          ...reduceStateToNewGroupBySetting(
            state,
            action.payload.value,
            exchangeModule.defaultOptions.defaultProduct.groupByFactors[0],
          ),
        };

      default:
        throw new Error('orderBook: unknown reducer: ' + action.type);
    }
  };
