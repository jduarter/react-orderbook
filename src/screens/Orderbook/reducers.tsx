/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                    | react-native-orderbook |                 *
 *                                                               *
 *  License |  MIT General Public License                        *
 *  Author  |  Jorge Duarte Rodríguez <info@malagadev.com>       *
 *                                                               *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {
    getNormalizedPrice,
    getGroupedPrice,
    immutableObjWithoutKeyIfExists,
    immutableObjReplacingKey,
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
    groupBy: 100,
    bids: {},
    asks: {},
    grouped: { bids: {}, asks: {} },
    pendingGroupUpdates: [],
};

const ENABLE_TWO_WAY_REDUCER_ACTIONS = true;

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
    mutatingKeyFunction: GenericMutatingFunctionType = immutableObjReplacingKey as GenericMutatingFunctionType,
): OrderbookOrdersSortedObject => {
    /*console.log();
    console.log(
        '    reduceKeyPairToState: input: initialState=',
        initialState,
        'updates: ',
        data,
    );
    */
    const res = data.reduce(
        (acc, [price, oSize]) =>
            mutatingKeyFunction(acc, getNormalizedPrice(price), oSize),
        initialState,
    );
    console.log('    reduceKeyPairToState: output:', res);
    return res;
};

const exactPriceIsWithinGroupPrice = (
    exact: number,
    groupPrice: number,
    groupBy: number,
) => exact >= groupPrice && exact < groupPrice + groupBy;

const getEstimatedMinimumSize = (
    sortedObj: OrderbookOrdersSortedObject,
    groupPrice: number,
    groupBy: number,
): number =>
    ob2arr(sortedObj).reduce(
        (acc, [currPrice, currSize]) =>
            acc +
            (exactPriceIsWithinGroupPrice(currPrice, groupPrice, groupBy)
                ? currSize
                : 0),
        0,
    );

export const mutateForGrouping = <
    T extends any[] = WebSocketOrderbookDataArray,
>(
    updates: T,
    groupBy: number,
    oldExactRootState: OrderbookOrdersSortedObject,
    newExactRootState: OrderbookOrdersSortedObject,
    initialState: OrderbookOrdersSortedObject,
): T => {
    if (updates.length === 0) {
        return ob2arr(initialState) as T;
    }
    console.log();
    console.log();
    console.log(
        '***** mutateForGrouping STARTS',
        'updates:',
        JSON.stringify(updates),
        'last exact NEW root state=',
        newExactRootState,
        'last exact OLD root state=',
        newExactRootState,
        'initial state=',
        initialState,
    );

    const initialAcc = initialState; //array2ob(initialReducerState);

    const r1 = updates.reduce((acc, [price, v], uridx) => {
        const normalizedExactPrice = getNormalizedPrice(price);
        const groupedPrice = getGroupedPrice(price, groupBy);
        const usePrice = getNormalizedPrice(groupedPrice); // getNormalizedGroupedPrice(price, groupBy);

        const minimum = getEstimatedMinimumSize(
            newExactRootState,
            groupedPrice,
            groupBy,
        );

        const oldExactPriceSizeIsKnown =
            normalizedExactPrice in oldExactRootState;

        const oldSizeForExact = oldExactPriceSizeIsKnown
            ? oldExactRootState[normalizedExactPrice]
            : undefined;

        const isNewExactElement =
            normalizedExactPrice in oldExactRootState === false;

        // if it's a new exact element, we should assume diff = v

        const exactDiff = isNewExactElement
            ? v
            : -1 * ((oldSizeForExact || 0) - v); // - v;
        /*
        const ed1 =
            oldExactRootState[normalizedExactPrice] -
            newExactRootState[normalizedExactPrice];
        const eda = -1 * ((oldSizeForExact || 0) - v);
        const ed2 = oldExactPriceSizeIsKnown ? eda : ed1;
        */
        /*
        const exactDiff = isNaN(ed1) ? (isNewExactElement ? v : ed2) : ed1; // isNewExactElement ? v : ed2;
*/
        /***/

        const oldGroupSize =
            ((usePrice in acc === false || acc[usePrice] < minimum) &&
            uridx === 0 &&
            minimum > 0
                ? minimum
                : acc[usePrice]) || 0;

        const oldGroupPriceSizeIsKnown = oldGroupSize !== undefined; // usePrice in acc;

        console.log(
            '[*] Starts function: process: ',
            [price, v],
            {
                p1: oldExactRootState[normalizedExactPrice],
                p2: oldGroupSize,
            },
            {
                minimum,
                isNewExactElement,
                exactDiff,
                oldSizeForExact,
                oldExactPriceSizeIsKnown,
                usePrice,
                normalizedExactPrice,
                acc,
                oldGroupSize,
            },
        );

        if (oldGroupPriceSizeIsKnown) {
            console.log({
                minimum,

                exactDiff,
                ppppP: oldGroupSize,
                ssss: oldGroupSize + exactDiff,
            });

            if (exactDiff !== 0) {
                const sumB = oldGroupSize + exactDiff;

                if (sumB <= 0) {
                    /* if (sumB !== 0 && v !== 0 && v > minimum) {
                        return { ...acc, [usePrice]: v };
                    }*/

                    if (exactDiff != 0 && sumB != 0 && sumB !== exactDiff) {
                        console.log('!! -> sumX', {
                            minimum,
                            sumB,
                            exactDiff,
                            ppppP: oldGroupSize,
                            ssss: oldGroupSize + exactDiff,
                        });

                        return {
                            ...acc,
                            [usePrice]: oldGroupSize + exactDiff,
                        };
                    }

                    if (minimum + sumB > 0) {
                        console.log('!! -> sumZ', { minimum, sumB, exactDiff });

                        return { ...acc, [usePrice]: minimum + sumB };
                    }

                    console.log('!! -> sumB', sumB, oldGroupSize, exactDiff, {
                        oldSizeForExact,
                    });
                    return immutableObjWithoutKeyIfExists(acc, usePrice);
                }

                console.log(
                    '  -> set <' +
                        usePrice +
                        '/' +
                        normalizedExactPrice +
                        '> to: ',
                    {
                        sumB,
                    },
                    ' from: ' + oldGroupSize,
                );
                return { ...acc, [usePrice]: sumB };
            } else {
                return { ...acc };
            }
        }

        console.log(
            '-> for ' + (isNewExactElement ? 'NEW' : '(old)') + ' key: ',
            price,
            ' -> ' + v + ' (eDiff: ' + exactDiff + ') [FALLBACK!!!] DEBUG: ',
            {
                oldSizeEXACT: oldSizeForExact || '(undef)',

                s1:
                    normalizedExactPrice in oldExactRootState
                        ? oldExactRootState[normalizedExactPrice]
                        : 'n/a',
                s2:
                    normalizedExactPrice in newExactRootState
                        ? newExactRootState[normalizedExactPrice]
                        : 'n/a',
            },
        );

        const oldGroupPriceSize = oldGroupPriceSizeIsKnown
            ? oldGroupSize
            : undefined;

        const newValue = oldGroupPriceSizeIsKnown
            ? oldGroupPriceSize + exactDiff
            : v;

        return { ...acc, [usePrice]: newValue /*+ (acc[usePrice] || 0) */ };
        /*
        const condDiff = exactDiff || 0; // (oldGroupPriceSize < v ? v : 0);

        const groupDiff = oldGroupPriceSizeIsKnown ? condDiff : v;

        const newValue = oldGroupPriceSizeIsKnown
            ? acc[usePrice] + groupDiff
            : groupDiff;

        console.log('for key: ', price, ' -> ' + v + ' DEBUG: ', {
            oldSizeEXACT: oldSizeForExact || '(undef)',
            exactDiff,
            oldSizeGROUP: oldGroupPriceSize || '(undef)',
            newValue,
            condDiff,
            groupDiff,
        });
*/
        /*
    if (newVal == 0) {
      return acc;
    }
    */
        //  const nn = [getGroupedPrice(price, groupBy), newValue];
        //  if (v > 0) console.log('NN  : ', nn);
        // return [...acc, nn];
    }, initialAcc);
    const r2 = ob2arr(r1);
    // podriamos simplemente devolver el acumulador y asi ahorrar en tiempo y ser mas eficientes,
    // incluso sin tener que requerir los 2 pasos que engloba la acccion de group-calculate
    // pero entonces perderiamos la posibilidad de poder hacer este proceso de forma individual y controlada
    // (lo que me hace preguntar, realmente necesitamos controlarlo?)
    console.log('RESULT: ', r2);
    console.log(); //{  r2 });
    return r2 as T;
};

const mutateScopeForGrouping = (
    updates: OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>,
    groupBy: number,
    oldExactRootState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
    newExactRootState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
    initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
): OrderbookGenericScopeDataType<WebSocketOrderbookDataArray> => {
    console.log('    mutateScopeForGrouping: initialState=', initialState);
    console.log();

    return {
        bids: mutateForGrouping(
            updates.bids,
            groupBy,
            oldExactRootState.bids,
            newExactRootState.bids,
            initialState.bids,
        ),
        asks: mutateForGrouping(
            updates.asks,
            groupBy,
            oldExactRootState.asks,
            newExactRootState.asks,
            initialState.asks,
        ),
    };
};

const getStateSelection = <
    S extends Record<any, any> = Record<any, any>,
    KN extends string = string,
>(
    keyNames: KN[],
    state: S,
): OrderbookOrdersSortedObject =>
    keyNames.reduce(
        (acc, current) =>
            !state[current]
                ? { ...acc }
                : { ...acc, [current]: state[current] },
        {},
    );

const getSelectedKeysForUpdates = (
    updates: WebSocketOrderbookUpdatesType,
    state: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
): OrderbookGenericScopeDataType<OrderbookOrdersSortedObject> => ({
    bids: getStateSelection<
        OrderbookOrdersSortedObject,
        OrderbookNormalizedPrice
    >(getAffectedPricesInUpdateList(updates.bids), state.bids),
    asks: getStateSelection<
        OrderbookOrdersSortedObject,
        OrderbookNormalizedPrice
    >(getAffectedPricesInUpdateList(updates.asks), state.asks),
});

const reduceUpdatesToScopedState = (
    updates: OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>,
    initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
    mutatingKeyFunction: GenericMutatingFunctionType = immutableObjReplacingKey as GenericMutatingFunctionType,
): OrderbookGenericScopeDataType<OrderbookOrdersSortedObject> => ({
    bids: reduceKeyPairToState(
        updates.bids,
        initialState.bids,
        mutatingKeyFunction,
    ),
    asks: reduceKeyPairToState(
        updates.asks,
        initialState.asks,
        mutatingKeyFunction,
    ),
});

const reduceUpdatesToScopedStateForGrouped = (
    updates: OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>,
    initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
    groupBy: number,
    oldExactRootState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
    newExactRootState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
) => {
    console.log();
    console.log('<> reduceUpdatesToScopedStateForGrouped STARTS');
    const mutatedData = mutateScopeForGrouping(
        updates,
        groupBy,
        oldExactRootState,
        newExactRootState,
        initialState,
    );

    console.log('    [G] ', {
        initialState,
        mutatedData: JSON.stringify(mutatedData),
    });

    const returnValue = reduceUpdatesToScopedState(
        mutatedData,
        initialState,
        //   immutableObjReplacingKeyWithSum as GenericMutatingFunctionType,
    );
    console.log();
    console.log('++ ret is:', returnValue);
    console.log();
    return returnValue;
};

const _c = (
    a: OrderbookOrdersSortedObject,
    b: OrderbookOrdersSortedObject,
): OrderbookOrdersSortedObject =>
    Object.keys(b).reduce(
        (acc, bKey) => ({ ...acc, [bKey]: (acc[bKey] || 0) + b[bKey] }),
        a,
    );

const combineLastStates = (
    a: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
    b: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
): OrderbookGenericScopeDataType<OrderbookOrdersSortedObject> => ({
    bids: _c(a.bids, b.bids),
    asks: _c(a.asks, b.asks),
});

const reducePendingGroupUpdatesToState = (
    state: OrderbookStateType,
): OrderbookStateType => {
    const { pendingGroupUpdates, ...stateWithoutPendingGroupUpdates } = state;

    const res = pendingGroupUpdates.reduce(
        (acc: OrderbookStateType, { updates }: PendingGroupUpdateRecord) => {
            const oldStateSelection = getSelectedKeysForUpdates(updates, acc);

            const newScopeState = reduceUpdatesToScopedState(
                updates,
                oldStateSelection,
            );

            const newStateSelection = getSelectedKeysForUpdates(
                updates,
                newScopeState,
            );

            const grouped = reduceUpdatesToScopedStateForGrouped(
                updates,
                acc.grouped,
                state.groupBy,
                oldStateSelection,
                newStateSelection,
            );

            const newMainState = combineLastStates(
                { bids: acc.bids, asks: acc.asks },
                {
                    bids: newScopeState.bids,
                    asks: newScopeState.asks,
                },
            );

            return { ...acc, ...newMainState, grouped };
        },
        { ...stateWithoutPendingGroupUpdates, pendingGroupUpdates: [] },
    );
    console.log('reducePendingGroupUpdatesToState: FINISHES: output: ', res); //state);
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
            updates: { ...updates },
            // selectedLastState: getSelectedKeysForUpdates(updates, state),
        },
    ],
});

export const orderBookReducer = (
    state: OrderbookStateType,
    action: OrderbookReducerAction,
): OrderbookStateType => {
    console.log('[ *!* ] Executing action: <' + action.type + '>');
    switch (action.type) {
        case 'CALCULATE_GROUPED':
            return ENABLE_TWO_WAY_REDUCER_ACTIONS
                ? reducePendingGroupUpdatesToState(state)
                : state;

            break;

        case 'ORDERBOOK_SNAPSHOT':
        case 'ORDERBOOK_UPDATE':
            return ENABLE_TWO_WAY_REDUCER_ACTIONS
                ? reduceNewTasksToQueue(state, action.payload.updates)
                : reducePendingGroupUpdatesToState(
                      reduceNewTasksToQueue(state, action.payload.updates),
                  );

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

const ob2arr = (
    input: OrderbookOrdersSortedObject,
    initialState = [],
): WebSocketOrderbookDataArray =>
    Object.entries(input).reduce(
        (acc: WebSocketOrderbookDataArray, [currentK, currentV]) => [
            ...acc,
            [customFormatNumberToFloat(currentK), currentV],
        ],
        initialState,
    );

// @ts-ignore
const array2ob = (
    input: WebSocketOrderbookDataArray,
    initialState = {},
): OrderbookOrdersSortedObject =>
    input.reduce((acc, [price, val]) => {
        return { ...acc, [getNormalizedPrice(price)]: val };
    }, initialState);
