import commaNumber from 'comma-number';

import type {
  OrderbookGroupedPrice,
  OrderbookNormalizedPrice,
  OrderbookDispatch,
  OrderbookGenericScopeDataType,
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

export const immutableGetReversedArr = <
  T extends [unknown, unknown] = [number, number],
>(
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
): [number, number][] => {
  const sortedObj = Array.from(map).reduce((acc, [ck, cv]) => {
    return { ...acc, [getNormalizedPrice(ck)]: cv };
  }, {});

  const array = Object.entries<number>(sortedObj);

  const sorted =
    orderBy === 'desc' ? array.slice(0, limit) : array.slice(-limit);

  return immutableGetReversedArr<[number, number]>(
    sorted.map(([k, v]) => [Number(k), v]),
  );
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

export const getAffectedPricesInUpdateList = (map: OrdersMap): number[] =>
  Array.from(map).map(([price]) => price);

export const exactPriceIsWithinGroupPrice = (
  exact: number,
  groupPrice: number,
  groupBy: number,
): boolean => exact >= groupPrice && exact < groupPrice + groupBy;
