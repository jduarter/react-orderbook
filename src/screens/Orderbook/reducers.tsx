/* eslint security/detect-object-injection:0 */

import { scope } from './utils';

import { scopeElementsWithoutZeroRecords } from './reducers/common';
import {
  applyMinimumThresholdsToGroups,
  reduceUpdatesToScopedStateForGrouped,
} from './reducers/grouping';

import type {
  OrderbookStateType,
  OrderbookReducerAction,
  ExchangeModule,
  PendingGroupUpdateRecord,
} from './types';

export const INITIAL_ORDERBOOK_STATE: OrderbookStateType = {
  ...scope(new Map(), new Map()),
  groupBy: 0,
  minGroupBy: 0,
  grouped: scope(new Map(), new Map()),
  isLoading: true,
};

export const reducePendingGroupUpdatesToState = (
  pendingGroupUpdate: PendingGroupUpdateRecord,
  state: OrderbookStateType,
): OrderbookStateType => {
  const { bids, asks, grouped, ...restOfAcc } = state;
  /*
  const groupedWithMinimumThresholdsApplied = applyFnToScope(grouped, (sc, k) =>
    applyMinimumThresholdsToGroups(
      sc,
      state.groupBy,
      state.minGroupBy,
      pendingGroupUpdate.updates[k],
    ),
  );

  console.log(
    'groupedWithMinimumThresholdsApplied: ',
    groupedWithMinimumThresholdsApplied,
  );

  console.log('starting reduceUpdatesToScopedStateForGrouped with params:', {
    updates: pendingGroupUpdate.updates,
    grouped,
  });
  */
  const newState = reduceUpdatesToScopedStateForGrouped(
    pendingGroupUpdate.updates, // groupedWithMinimumThresholdsApplied,
    grouped,
    state.groupBy,
    state.minGroupBy,
    scope(bids, asks),
  );

  return {
    ...restOfAcc,
    ...scopeElementsWithoutZeroRecords(newState),
    grouped: scopeElementsWithoutZeroRecords(newState.grouped),
  };
  /*  },
    state,
  );*/
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
    minGroupBy,
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
            acc,
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
