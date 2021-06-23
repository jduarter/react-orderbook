import commaNumber from 'comma-number';

import type {
  OrderbookGroupedPrice,
  OrderbookNormalizedPrice,
  OrderbookDispatch,
  OrderbookGenericScopeDataType,
  OrdersMap,
  OrderbookOrdersSortedObject,
} from './types';

type SortByOperationTypes = -1 | 1;
type GroupByOptionType = number;

const AVAILABLE_FACTORS = [
  0.1, 0.25, 0.5, 1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
];

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

export const getGroupedPrice = (
  price: number,
  groupBy: number,
): OrderbookGroupedPrice => Math.floor(price / groupBy) * groupBy;

export const getNormalizedPrice = (
  input: number,
  decimals = 2,
): OrderbookNormalizedPrice => (Math.pow(10, decimals) * input).toString();

export const immutableGetReversedArr = <
  T extends [unknown, unknown] = [number, number],
>(
  array: T[],
): T[] => {
  const copy = [...array];
  copy.reverse();
  return copy;
};

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
  const array = mapToSortedArr(map, false);
  const sorted =
    orderBy === 'desc' ? array.slice(0, limit) : array.slice(-limit);
  return immutableGetReversedArr<[number, number]>(sorted);
};

export const getGroupByFactor = (
  groupBy: GroupByOptionType,
  op: SortByOperationTypes,
): number => {
  const currentIndex = AVAILABLE_FACTORS.indexOf(groupBy);
  if (currentIndex + op >= 0 && currentIndex + op <= AVAILABLE_FACTORS.length) {
    const nextStateVal = AVAILABLE_FACTORS[currentIndex + op];
    // eslint-disable-next-line security/detect-object-injection
    const currentStateVal = AVAILABLE_FACTORS[currentIndex];

    return op === -1
      ? currentStateVal / nextStateVal
      : nextStateVal / currentStateVal; // / nextStateVal;
  }
  return 0;
};

export const getGroupByButtonPressEventHandler =
  (v: -1 | 1, groupBy: number, orderBookDispatch: OrderbookDispatch) =>
  (): void => {
    // eslint-disable-next-line no-restricted-globals
    setImmediate(() => {
      const f = getGroupByFactor(groupBy, v);

      if (f > 0) {
        orderBookDispatch({
          type: 'SET_GROUP_BY',
          payload: {
            value:
              v === -1
                ? groupBy / getGroupByFactor(groupBy, v)
                : groupBy * getGroupByFactor(groupBy, v),
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
    if (currVal === 0) {
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

export const getNormalizedGroupedPrice = (
  price: number,
  groupBy: number,
  decimals = 2,
): OrderbookNormalizedPrice =>
  getNormalizedPrice(getGroupedPrice(price, groupBy), decimals);

export const customFormatNumberToFloat = (price: string): number =>
  Number.parseInt(price) / 100;

export const extractPricesFromMap = (m: OrdersMap): number[] =>
  Array.from(m).map(([price]) => price);

export const exactPriceIsWithinGroupPrice = (
  exact: number,
  groupPrice: number,
  groupBy: number,
): boolean => exact >= groupPrice && exact < groupPrice + groupBy;

export const arrayAt = <T>(arr: T[], idx: number): T =>
  arr[idx >= 0 ? idx : arr.length + idx];

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
