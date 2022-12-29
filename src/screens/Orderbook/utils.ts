// import commaNumber from 'comma-number';

import type { Decimal } from 'decimal.js';

import type {
  OrderbookDispatch,
  OrderbookGenericScopeDataType,
  OrdersMap,
} from './types';

type SortByOperationTypes = -1 | 1;
type GroupByOptionType = number;
/*
const numberFormater = (
  overrideThousandSeparator = ',',
  overrideDecimalSeparator = '.',
) => commaNumber.bindWith(overrideThousandSeparator, overrideDecimalSeparator);

export const formatNumber = (v: number, decimals = 2): string =>
  numberFormater()(commaNumber(v.toFixed(decimals)));

const denormalizePrice = (
  input: OrderbookNormalizedPrice | number,
  decimalsToParse: number,
): number => Number.parseFloat(input as any) / Math.pow(10, decimalsToParse);

export const getPrintPriceForNormalizedPrice = (
  input: OrderbookNormalizedPrice,
  decimalsToPrint = 2,
  decimalsToParse = 2,
): string =>
  formatNumber(denormalizePrice(input, decimalsToParse), decimalsToPrint);
*/
export const getGroupedPrice = (
  optimalIntegerPriceRepr: number,
  groupBy: number,
  minGroupBy: number,
  priceMaxDecPrecision: number = 2,
) => {
  const price = optimalIntegerPriceRepr / Math.pow(10, priceMaxDecPrecision);
  const isMinimumGroupBy = groupBy === minGroupBy;
  const ret = Math.floor(price / groupBy) * groupBy;

  if (true || isMinimumGroupBy) {
    return Math.round(ret * Math.pow(10, priceMaxDecPrecision));
  } else {
    return Math.round((ret + groupBy) * Math.pow(10, priceMaxDecPrecision));
  }
};

/* 
export const getGroupedPrice = (
  // price: number,
  optimalIntegerPriceRepr: number,
  groupBy: number,
  minGroupBy: number,
): number => {
  const price = optimalIntegerPriceRepr / Math.pow(10, 2);
  console.log('* getGroupedPrice: ', { price, groupBy, minGroupBy });
  const isMinimumGroupBy = groupBy === minGroupBy; // new Decimal(groupBy).eq(minGroupBy);

  const ret = Math.floor(price / groupBy) * groupBy; // price.div(groupBy).floor().mul(groupBy);
  if (isMinimumGroupBy) {
    return Math.round(ret * Math.pow(10, 2));
  } else {
    //return Math.round(Math.ceil(ret + groupBy) * Math.pow(10, 2));
    return Math.round(Math.ceil((ret + groupBy) * Math.pow(10, 2)));
    // ret.add(groupBy);
  }
};

export const getGroupedPrice = (
  price: number,
  groupBy: number,
  minGroupBy: number,
): OrderbookGroupedPrice => {
  const ret = parseInt(
    Math.floor(price / Math.pow(10, 8) / groupBy) * groupBy * Math.pow(10, 8),
  ); //price.floor(groupBy).mul(groupBy);
   console.log('[i] getGroupedPrice: price:', {
    price,
    groupBy,
    minGroupBy,
    tPrice: typeof price,
    RESULT: ret,
  }); 
  return ret;
}; //Math.floor(price / groupBy) * groupBy;
*/
/*
export const getNormalizedPrice = (
  input: number,
  decimals = 2,
): OrderbookNormalizedPrice =>
  parseInt(Math.pow(10, decimals) * input).toString();
  */

/*
export const mapToSortedObj = (m: OrdersMap): OrderbookOrdersSortedObject =>
  Array.from(m).reduce(
    (acc, [ck, cv]) => ({
      ...acc,
      [getNormalizedPrice(ck)]: cv,
    }),
    {},
  );

export const mapToSortedArr = (
  m: OrdersMap,
  shouldDenormalizePrice = true,
): [number, number][] =>
  Object.entries(mapToSortedObj(m)).map((x) => [
    shouldDenormalizePrice ? denormalizePrice(Number(x[0]), 2) : Number(x[0]),
    x[1],
  ]);

export const orderAndLimit = (
  map: OrdersMap,
  limit = 10,
  orderBy: 'asc' | 'desc' = 'asc',
): [number, number][] => {
  const array = [...map].sort((a, b) => a[0] > b[0]);

  const sorted =
    orderBy === 'desc' ? array.slice(0, limit) : array.slice(-limit);

  const result = immutableGetReversedArr<[number, number]>(sorted);

  return result;
};
*/
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
    //console.log('wipeZeroRecords: ', { currVal, tCurrVal: typeof currVal });
    if (currVal.isZero()) {
      //} === 0) {
      //console.log('WipeZeroRecords: ', { currKey, tCurrKey: typeof currKey });
      ret.delete(currKey);
    }
  }
  return ret;
};

export const applyFnToScope = <
  T extends OrdersMap = OrdersMap,
  FR = OrderbookGenericScopeDataType<T>,
  I extends OrderbookGenericScopeDataType<T> = OrderbookGenericScopeDataType<T>,
>(
  input: I,
  transformer: (input: OrdersMap, k: keyof I) => FR,
): OrderbookGenericScopeDataType<FR> => ({
  bids: transformer(input.bids, 'bids' as keyof I),
  asks: transformer(input.asks, 'asks' as keyof I),
});
/*
export const getNormalizedGroupedPrice = (
  price: number,
  groupBy: number,
  decimals = 2,
): OrderbookNormalizedPrice => {
  console.log('getNormalizedGroupedPrice: ', { price, groupBy, decimals });

  const ret = getNormalizedPrice(getGroupedPrice(price, groupBy), decimals);
  console.log('--> ', ret);
  return ret;
};

export const customFormatNumberToFloat = (price: string): number =>
  Number.parseInt(price) / 100;
*/

export const extractPricesFromMap = (m: OrdersMap): number[] =>
  Array.from(m).map(([price]) => price);

export const exactPriceIsWithinGroupPrice = (
  exact: number,
  groupPrice: number,
  groupBy: number,
): boolean => exact >= groupPrice && exact < groupPrice + groupBy;

/*
export const arrayAt = <T>(arr: T[], idx: number): T =>
  arr[idx >= 0 ? idx : arr.length + idx];
*/

export const scope = <T extends OrdersMap = OrdersMap>(
  bids: T,
  asks: T,
): { bids: T; asks: T } => ({
  bids,
  asks,
});

export const sortedObjValueSymDiff = (a: number[], b: number[]): number[] =>
  a.filter((x) => !b.includes(x)).concat(b.filter((x) => !a.includes(x)));

export const calculateDiff = (
  before: number[],
  after: number[],
): { created: number[]; removed: number[] } => ({
  created: after.filter((x) => !before.includes(x)),
  removed: before.filter((x) => !after.includes(x)),
});
