import commaNumber from 'comma-number';

import type {
  GenericMutatingFunctionType,
  OrderbookGroupedPrice,
  OrderbookNormalizedPrice,
  OrderbookOrdersSortedObject,
} from './types';

import type {
  WebSocketOrderbookDataArray,
  WebSocketOrderbookSizePricePair,
} from '../../hooks/useWebSocket';

type SortByOperationTypes = -1 | 1;
type GroupByOptionType = number;

const AVAILABLE_FACTORS = [
  0.1, 0.25, 0.5, 1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
];

// .toLocaleString('en-US', { minimumFractionDigits: 2 });
// doesnt properly work in RN in certain circumstances
// forcing format to Spanish emulation

const _format = (
  overrideThousandSeparator = ',',
  overrideDecimalSeparator = '.',
) => commaNumber.bindWith(overrideThousandSeparator, overrideDecimalSeparator);

const __format = _format();

export const formatNumber = (v: number, decimals = 2): string =>
  __format(commaNumber(v.toFixed(decimals)));

export const getPrintPriceForNormalizedPrice = (
  input: OrderbookNormalizedPrice,
  decimals = 2,
): string =>
  formatNumber(Number.parseFloat(input) / Math.pow(10, decimals), decimals);

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

const immutableObjectWithoutKey = <O extends Record<string, any>>(
  obj: O,
  key: string,
): O => {
  // if (dbgInfo && dbgInfo !== 'immutableObjReplacingKey')

  /*  console.log(
        'immutableObjWithoutKey: delete key! <' + key + '> ( ' + dbgInfo + ')',
    );
*/
  const objCopy: O = { ...obj };
  delete objCopy[key];

  if (key in objCopy) {
    console.log('ERRRORRR: DELETE WAS NOT WORKING!!!!!!');
  }

  return objCopy;
};

export const immutableObjWithoutKeyIfExists = <O extends Record<string, any>>(
  obj: O,
  key: string,
): O => {
  // if (dbgInfo && dbgInfo !== 'immutableObjReplacingKey')

  return key in obj === false ? obj : immutableObjectWithoutKey(obj, key);
};

export const immutableObjReplacingKey = <
  V,
  O extends Record<string, V> = Record<string, V>,
>(
  obj: O,
  key: string,
  v: number,
): O => {
  /*console.log(
        'immutableObjReplacingKey: add <' + key + '> with val: ',
        v,
    );
    */

  if (v < 0) {
    console.log(
      '-----> WARNING!! VALUE IS ' + v + ' ----- <> ----  ',
      key,
      v,
      typeof v,
      {
        obj,
      },
    );
  }

  return v <= 0
    ? immutableObjWithoutKeyIfExists<O>(obj, key)
    : { ...obj, [key]: v };
};

export const immutableGetReversedArr = <T extends unknown = any>(
  array: T[],
): T[] => {
  const copy = [...array];
  copy.reverse();
  return copy;
};

export const orderAndLimit = (
  obj: OrderbookOrdersSortedObject,
  limit = 10,
  orderBy: 'asc' | 'desc' = 'asc',
): WebSocketOrderbookDataArray => {
  const array = Object.entries(obj)
    .slice(0, limit)
    .map(([key, size]): WebSocketOrderbookSizePricePair => [Number(key), size]);

  return orderBy === 'desc' ? immutableGetReversedArr(array) : array;
};

export const getGroupByFactor = (
  groupBy: GroupByOptionType,
  op: SortByOperationTypes,
) => {
  if (op === 1) {
    const index = AVAILABLE_FACTORS.indexOf(groupBy);
    if (index >= 0 && index - 1 <= AVAILABLE_FACTORS.length) {
      return AVAILABLE_FACTORS[index + 1] / AVAILABLE_FACTORS[index];
    }
    return 0;
  } else {
    return groupBy % 2 === 0 ? 2 : 2.5;
  }
};
