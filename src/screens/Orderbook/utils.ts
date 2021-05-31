import commaNumber from 'comma-number';

import type {
  GenericMutatingFunctionType,
  OrderbookGroupedPrice,
  OrderbookNormalizedPrice,
  OrderbookOrdersSortedObject,
  OrderbookDispatch,
  OrderbookGenericScopeDataType,
  WSDataPriceSizePair,
  OrdersMap,
} from './types';

type SortByOperationTypes = -1 | 1;
type GroupByOptionType = number;

const AVAILABLE_FACTORS = [
  0.1, 0.25, 0.5, 1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
];

// .toLocaleString('en-US', { minimumFractionDigits: 2 });
// doesnt properly work in RN in certain circumstances
// forcing format to Spanish emulation

const numberFormater = (
  overrideThousandSeparator = ',',
  overrideDecimalSeparator = '.',
) => commaNumber.bindWith(overrideThousandSeparator, overrideDecimalSeparator);

export const formatNumber = (v: number, decimals = 2): string =>
  numberFormater()(commaNumber(v.toFixed(decimals)));

export const getPrintPriceForNormalizedPrice = (
  input: OrderbookNormalizedPrice,
  decimalsToPrint = 2,
  decimalsToParse = 2,
): string =>
  formatNumber(
    Number.parseFloat(input) / Math.pow(10, decimalsToParse),
    decimalsToPrint,
  );

export const getGroupedPrice = (
  price: number,
  groupBy: number,
): OrderbookGroupedPrice => Math.floor(price / groupBy) * groupBy;

export const getNormalizedPrice = (
  input: number,
  decimals = 2,
): OrderbookNormalizedPrice => (Math.pow(10, decimals) * input).toString();

export const wrapWithLogName =
  (
    mutatingKeyFunction: GenericMutatingFunctionType,
    dbgInfo: string,
  ): GenericMutatingFunctionType =>
  (a: unknown, b: any, c: number) =>
    mutatingKeyFunction(a, b, c, dbgInfo);

export const immutableObjectWithoutKey = <O extends Record<string, any>>(
  obj: O,
  key: string,
): O => {
  const objCopy: O = { ...obj };
  // eslint-disable-next-line security/detect-object-injection
  delete objCopy[key];
  return objCopy;
};

export const immutableObjWithoutKeyIfExists = <O extends Record<string, any>>(
  obj: O,
  key: string,
): O => (key in obj === false ? obj : immutableObjectWithoutKey(obj, key));

export const immutableObjReplacingKey = <
  V,
  O extends Record<string, V> = Record<string, V>,
>(
  obj: O,
  key: string,
  v: number,
): O =>
  v <= 0 ? immutableObjWithoutKeyIfExists<O>(obj, key) : { ...obj, [key]: v };

export const immutableGetReversedArr = <T extends unknown = any>(
  array: T[],
): T[] => {
  const copy = [...array];
  copy.reverse();
  return copy;
};

export const orderAndLimit = (
  map: OrdersMap,
  limit = 10,
  orderBy: 'asc' | 'desc' = 'asc',
): WSDataPriceSizePair[] => {
  const sortedObj = Array.from(map).reduce((acc, [ck, cv]) => {
    return { ...acc, [getNormalizedPrice(ck)]: cv };
  }, {});

  const array = Object.entries(sortedObj);

  const sorted =
    orderBy === 'desc' ? array.slice(0, limit) : array.slice(-limit);

  const r1 = sorted.map(
    ([key, size]): WSDataPriceSizePair => [Number(key), size],
  );

  return immutableGetReversedArr(r1);
};

export const getGroupByFactor = (
  groupBy: GroupByOptionType,
  op: SortByOperationTypes,
): number => {
  if (op === 1) {
    const index = AVAILABLE_FACTORS.indexOf(groupBy);
    if (index >= 0 && index - 1 <= AVAILABLE_FACTORS.length) {
      // eslint-disable-next-line security/detect-object-injection
      return AVAILABLE_FACTORS[index + 1] / AVAILABLE_FACTORS[index];
    }
    return 0;
  } else {
    return groupBy % 2 === 0 ? 2 : 2.5;
  }
};

export const getGroupByButtonPressEventHandler =
  (v: -1 | 1, groupBy: number, orderBookDispatch: OrderbookDispatch) =>
  (): void => {
    // eslint-disable-next-line no-restricted-globals
    setImmediate(() => {
      const f =
        (v === 1 || (v === -1 && groupBy !== 1)) &&
        getGroupByFactor(groupBy, v);

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

export const reduceScopeWithFn = <
  T extends OrdersMap = OrdersMap,
  FR = OrderbookGenericScopeDataType<T>,
>(
  input: OrderbookGenericScopeDataType<T>,
  transformer: (input: OrdersMap) => FR,
): OrderbookGenericScopeDataType<FR> => ({
  bids: transformer(input.bids) as FR,
  asks: transformer(input.asks) as FR,
});

export const ob2arr = (
  input: OrderbookOrdersSortedObject,
  initialState = [],
): WSDataPriceSizePair[] =>
  Object.entries(input).reduce(
    (acc: WSDataPriceSizePair[], [currentK, currentV]) => [
      ...acc,
      [customFormatNumberToFloat(currentK), currentV],
    ],
    initialState,
  );

export const arr2obj = (
  input: WSDataPriceSizePair[],
  initialState = {},
): OrderbookOrdersSortedObject =>
  input.reduce(
    (acc: OrderbookOrdersSortedObject, [price, val]: WSDataPriceSizePair) => {
      return { ...acc, [getNormalizedPrice(price)]: val };
    },
    initialState,
  );

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

export const getAffectedPricesInUpdateList = (map: OrdersMap): number[] =>
  Array.from(map).map(([price]: WSDataPriceSizePair) => price);

export const exactPriceIsWithinGroupPrice = (
  exact: number,
  groupPrice: number,
  groupBy: number,
): boolean => exact >= groupPrice && exact < groupPrice + groupBy;

export const getEstimatedMinimumSize = (
  sortedObj: OrderbookOrdersSortedObject,
  groupPrice: number,
  groupBy: number,
): number => {
  const ret = ob2arr(sortedObj).reduce(
    (acc, [currPrice, currSize]) =>
      acc +
      (exactPriceIsWithinGroupPrice(currPrice, groupPrice, groupBy)
        ? currSize
        : 0),
    0,
  );
  return ret;
};
