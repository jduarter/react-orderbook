/* eslint security/detect-object-injection:0 */

import {
    getNormalizedPrice,
    getGroupedPrice,
    immutableObjReplacingKey,
} from './utils';

import type {
    OrderbookNormalizedPrice,
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
    options: { disableTwoWayProcessing: true },
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
): OrderbookOrdersSortedObject => {
    console.log(
        '    reduceKeyPairToState: input: initialState=',
        initialState,
        'updates: ',
        data,
    );

    const res = data.reduce(
        (acc, [price, oSize]) =>
            immutableObjReplacingKey(acc, getNormalizedPrice(price), oSize),
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

export const mutateForGrouping = (
    updates: WebSocketOrderbookDataArray,
    groupBy: number,
    inputLastKnownExactValues: OrderbookOrdersSortedObject,
    initialState: OrderbookOrdersSortedObject,
): [WebSocketOrderbookDataArray, OrderbookOrdersSortedObject] => {
    if (updates.length === 0) {
        return [ob2arr(initialState), inputLastKnownExactValues];
    }
    console.log();
    console.log();
    console.log(
        '***** mutateForGrouping STARTS',
        'updates:',
        JSON.stringify(updates),

        'last exact known values=',
        inputLastKnownExactValues,
        'initial state=',
        initialState,
    );

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

            console.log('');
            console.log(
                '[***] Starts function: process: ',
                {
                    in: { price, v },
                },
                {
                    exact: { old: oldSizeForExact, diff: exactDiff },
                },
                { group: { old: oldGroupSize } },
            );

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
    const r2 = ob2arr(r1.acc);

    console.log('RESULT OF NEW EXACT VALUES: ', r1.lastKnownExactValues);

    console.log('EXACT VALUES ORIG WAS: : ', inputLastKnownExactValues);

    console.log('RESULT: ', r2);
    console.log(); //{  r2 });
    return [r2, r1.lastKnownExactValues];
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
    /*  console.log('    mutateScopeForGrouping: initialState=', initialState);
    console.log();
*/
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

const reduceUpdatesToScopedStateForGrouped = (
    updates: OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>,
    initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
    groupBy: number,
    oldExactRootState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
) => {
    console.log();
    console.log('<> reduceUpdatesToScopedStateForGrouped STARTS');
    /**
     * convertir datos en delta "sustitutivo"
     */
    const { newMainState, groupedMutatedData } = mutateScopeForGrouping(
        updates,
        groupBy,
        oldExactRootState,
        initialState,
    );

    console.log('    [G] ', {
        initialState,
        mutatedData: JSON.stringify(groupedMutatedData),
    });

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
    groups: OrderbookOrdersSortedObject,
    groupBy: number,
    updates: WebSocketOrderbookDataArray,
) => {
    if (updates.length === 0) {
        console.log('applyMinimumThresholdsToGroups: updates.length = 0');
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
            const groupedPrice =
                parseFloat(normalizedGroupedPrice) / Math.pow(10, 2);
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

    console.log('applyMinimumThresholdsToGroups R1 is: ', r1);

    return r1;
};

const reducePendingGroupUpdatesToState = (
    state: OrderbookStateType,
): OrderbookStateType => {
    const { pendingGroupUpdates, ...stateWithoutPendingGroupUpdates } = state;

    const res = pendingGroupUpdates.reduce(
        (acc: OrderbookStateType, { updates }: PendingGroupUpdateRecord) => {
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

            const { grouped, newMainState } =
                reduceUpdatesToScopedStateForGrouped(
                    updates,
                    groupedWithMinimumThresholdsApplied,
                    state.groupBy,
                    acc,
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
        },
    ],
});

export const orderBookReducer = (
    state: OrderbookStateType,
    action: OrderbookReducerAction,
): OrderbookStateType => {
    console.log('[ *!* ] Executing action: <' + action.type + '>', state);
    switch (action.type) {
        case 'CALCULATE_GROUPED':
            return state.options.disableTwoWayProcessing === false
                ? reducePendingGroupUpdatesToState(state)
                : { ...state };

            break;

        case 'ORDERBOOK_SNAPSHOT':
        case 'ORDERBOOK_UPDATE':
            return state.options.disableTwoWayProcessing === false
                ? reduceNewTasksToQueue(state, action.payload.updates)
                : reducePendingGroupUpdatesToState(
                      reduceNewTasksToQueue(state, action.payload.updates),
                  );

            break;

        case 'SET_GROUP_BY':
            console.log('SET_GROUP_BY');
            const { newMainState, grouped } =
                reduceUpdatesToScopedStateForGrouped(
                    {
                        bids: Object.entries(state.bids),
                        asks: Object.entries(state.asks),
                    },
                    { ...INITIAL_ORDERBOOK_STATE.grouped },
                    action.payload.value,
                    { bids: {}, asks: {} },
                );
            return {
                ...state,
                ...newMainState,
                groupBy: action.payload.value,
                grouped,
            };
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

export const array2ob = (
    input: WebSocketOrderbookDataArray,
    initialState = {},
): OrderbookOrdersSortedObject =>
    input.reduce((acc, [price, val]) => {
        return { ...acc, [getNormalizedPrice(price)]: val };
    }, initialState);
