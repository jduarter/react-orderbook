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

export const formatNumber = (v: number, decimals = 2) => {
  // console.log('formatNumber: ', v, ' -> ');
  const r = __format(commaNumber(v.toFixed(decimals)));
  //  console.log('formatNumber: ', v, '     `-> ', r);
  return r;
};

export const getPrintPriceForNormalizedPrice = (
  input: OrderbookNormalizedPrice,
  decimals = 2,
) => {
  const r = formatNumber(parseFloat(input) / Math.pow(10, decimals), decimals);
  //console.log('getPrintPriceForNormalizedPrice: ', { input, r });
  return r;
};

export const getGroupedPrice = (
  price: number,
  groupBy: number,
): OrderbookGroupedPrice => Math.floor(price / groupBy) * groupBy;

export const getNormalizedPrice = (
  input: number,
  decimals = 2,
): OrderbookNormalizedPrice => {
  const r = (Math.pow(10, decimals) * input).toString();
  //  console.log('getNormalizedPrice ', input, r);
  return r;
};

export const wrapWithLogName =
  (
    mutatingKeyFn: GenericMutatingFunctionType,
    dbgInfo: string,
  ): GenericMutatingFunctionType =>
  (a: unknown, b: any, c: number) =>
    mutatingKeyFn(a, b, c, dbgInfo);

const immutableObjWithoutKey = <O extends Record<string, any>>(
  obj: O,
  key: string,
  dbgInfo = '*',
): O => {
  // if (dbgInfo && dbgInfo !== 'immutableObjReplacingKey')
  console.log(
    'immutableObjWithoutKey: delete key! <' + key + '> ( ' + dbgInfo + ')',
  );

  const objCopy: O = { ...obj };
  delete objCopy[key];
  return objCopy;
};

export const immutableObjWithoutKeyIfExists = <O extends Record<string, any>>(
  obj: O,
  key: string,
  dbgInfo = '*',
): O => {
  // if (dbgInfo && dbgInfo !== 'immutableObjReplacingKey')
  console.log(
    'immutableObjWithoutKeyIfExists: delete key (if exists) <' +
      key +
      '> ( ' +
      dbgInfo +
      ')',
    obj,
  );
  return key in obj === false
    ? { ...obj }
    : immutableObjWithoutKey(obj, key, dbgInfo);
};

export const immutableObjReplacingKey = <
  V,
  O extends Record<string, V> = Record<string, V>,
>(
  obj: O,
  key: string,
  val: V,
): O => {
  console.log('immutableObjReplacingKey: add <' + key + '> with val: ', val);
  if (!val) {
    return immutableObjWithoutKeyIfExists<O>(
      obj,
      key,
      'immutableObjReplacingKey',
    );
  } else {
    return { ...obj, [key]: val };
  }
};

export const immutableGetReversedArr = <T extends unknown = any>(
  arr: Array<T>,
): Array<T> => {
  const copy = [...arr];
  copy.reverse();
  return copy;
};

export const orderAndLimit = (
  obj: OrderbookOrdersSortedObject,
  limit = 10,
  orderBy: 'asc' | 'desc' = 'asc',
): WebSocketOrderbookDataArray => {
  const arr = Object.entries(obj)
    .slice(0, limit)
    .map(([key, size]): WebSocketOrderbookSizePricePair => [Number(key), size]);

  return orderBy === 'desc' ? immutableGetReversedArr(arr) : arr;
};

export const getGroupByFactor = (
  groupBy: GroupByOptionType,
  op: SortByOperationTypes,
) => {
  if (op === 1) {
    const idx = AVAILABLE_FACTORS.indexOf(groupBy);
    if (idx >= 0 && idx - 1 <= AVAILABLE_FACTORS.length) {
      return AVAILABLE_FACTORS[idx + 1] / AVAILABLE_FACTORS[idx];
    }
    return 0;
  } else {
    if (groupBy % 2 === 0) {
      return 2;
    } else {
      return 2.5;
    }
  }
};
