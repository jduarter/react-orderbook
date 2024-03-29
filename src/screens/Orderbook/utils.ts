import type {
  OrderbookDispatch,
  OrderbookGenericScopeDataType,
  OrdersMap,
} from './types';

import { Decimal } from 'decimal.js';

type SortByOperationTypes = -1 | 1;
type GroupByOptionType = number;

const safeExactDiv = (
  dividend: number,
  divisor: number,
  safetyFactor: number = 5,
): number => {
  const f = Math.pow(10, safetyFactor);
  return Math.round(f * (dividend / divisor)) / f;
};

export const getGroupedPrice = (
  optimalIntegerPriceRepr: number,
  groupBy: number,
  priceMaxDecPrecision: number = 2,
) => {
  const price = safeExactDiv(
    optimalIntegerPriceRepr,
    Math.pow(10, priceMaxDecPrecision),
  );
  const ret = Math.floor(safeExactDiv(price, groupBy)) * groupBy;
  return Math.round(ret * Math.pow(10, priceMaxDecPrecision));
};

export const getGroupByFactor = (
  groupBy: GroupByOptionType,
  op: SortByOperationTypes,
  availableFactors: number[],
): number => {
  const currentIndex = availableFactors.indexOf(groupBy);
  if (currentIndex + op >= 0 && currentIndex + op <= availableFactors.length) {
    const nextStateVal = availableFactors[currentIndex + op];
    // eslint-disable-next-line security/detect-object-injection
    const currentStateVal = availableFactors[currentIndex];

    return op === -1
      ? currentStateVal / nextStateVal
      : nextStateVal / currentStateVal; // / nextStateVal;
  }
  return 0;
};

export const getGroupByButtonPressEventHandler =
  (
    v: -1 | 1,
    groupBy: number,
    orderBookDispatch: OrderbookDispatch,
    availableFactors: number[],
  ) =>
  (): void => {
    // eslint-disable-next-line no-restricted-globals
    setImmediate(() => {
      const f = getGroupByFactor(groupBy, v, availableFactors);

      if (f > 0) {
        orderBookDispatch({
          type: 'SET_GROUP_BY',
          payload: {
            value:
              v === -1
                ? groupBy / getGroupByFactor(groupBy, v, availableFactors)
                : groupBy * getGroupByFactor(groupBy, v, availableFactors),
          },
        });
      }
    });
  };

export const calculateSpread = (high: number, low: number): number => {
  if (!low || !high) {
    return 0;
  }

  return -1 * (high / low - 1) * 100;
};

export const wipeZeroRecords = (input: OrdersMap): OrdersMap => {
  const ret = new Map(input);
  const arr = Array.from(input.entries());
  for (const [currKey, currVal] of arr) {
    if (currVal.isZero()) {
      ret.delete(currKey);
    }
  }
  return ret;
};

export const applyFnToScope = <
  T extends unknown = OrdersMap,
  TR extends Map<unknown, unknown> = OrdersMap,
  I extends OrderbookGenericScopeDataType<T> = OrderbookGenericScopeDataType<T>,
>(
  input: I,
  transformer: (input: T, k: keyof I) => TR,
): OrderbookGenericScopeDataType<TR> => ({
  bids: transformer(input.bids, 'bids' as keyof I),
  asks: transformer(input.asks, 'asks' as keyof I),
});

export const exactPriceIsWithinGroupPrice = (
  exact: number,
  groupPrice: number,
  groupBy: number,
): boolean => exact >= groupPrice && exact < groupPrice + groupBy;

export const scope = <T extends {} = OrdersMap>(
  bids: T,
  asks: T,
): { bids: T; asks: T } => ({
  bids,
  asks,
});

const toOptimalInteger = (input: string, optimalIntReprPowFactor: number) =>
  Math.round(parseFloat(input) * 10 ** optimalIntReprPowFactor); // safeExactMul([, 10 ** optimalIntReprPowFactor], 5);

export const toNormalizedMap = (
  input: [string, string][],
  optimalIntReprPowFactor: number,
): OrdersMap =>
  new Map(
    input.map((el) => [
      toOptimalInteger(el[0], optimalIntReprPowFactor),
      new Decimal(el[1]),
    ]),
  );

export const asyncSleep = (ms: number): Promise<unknown> =>
  new Promise((resolve) => setTimeout(resolve, ms));
