/* eslint security/detect-object-injection:0 */

import { applyFnToScope, scope } from './utils';

import { scopeElementsWithoutZeroRecords } from './reducers/common';
import {
  applyMinimumThresholdsToGroups,
  reduceUpdatesToScopedStateForGrouped,
  ensureConsistencyWithDiff,
} from './reducers/grouping';

import type {
  OrderbookGenericScopeDataType,
  OrderbookStateType,
  OrdersMap,
  OrderbookReducerAction,
} from './types';

export const INITIAL_ORDERBOOK_STATE: OrderbookStateType = {
  ...scope(new Map(), new Map()),
  groupBy: 100,
  grouped: scope(new Map(), new Map()),
  isLoading: true,
};

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
