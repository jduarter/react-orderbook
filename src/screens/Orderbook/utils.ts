/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                               *
 *                    | react-native-orderbook |                 *
 *                                                               *
 *  License |  MIT General Public License                        *
 *  Author  |  Jorge Duarte Rodríguez <info@malagadev.com>       *
 *                                                               *
 *                            (c) 2021                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
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
  0.1, 0.25, 0.5, 1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10_000,
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
  const r = formatNumber(Number.parseFloat(input) / Math.pow(10, decimals), decimals);
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
    mutatingKeyFunction: GenericMutatingFunctionType,
    dbgInfo: string,
  ): GenericMutatingFunctionType =>
    (a: unknown, b: any, c: number) =>
      mutatingKeyFunction(a, b, c, dbgInfo);

const immutableObjectWithoutKey = <O extends Record<string, any>>(
  object: O,
  key: string,
  dbgInfo = '*',
): O => {
  // if (dbgInfo && dbgInfo !== 'immutableObjReplacingKey')
  console.log(
    'immutableObjWithoutKey: delete key! <' + key + '> ( ' + dbgInfo + ')',
  );

  const objectCopy: O = { ...object };
  delete objectCopy[key];
  return objectCopy;
};

export const immutableObjWithoutKeyIfExists = <O extends Record<string, any>>(
  object: O,
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
    object,
  );
  return key in object === false
    ? { ...object }
    : immutableObjectWithoutKey(object, key, dbgInfo);
};

export const immutableObjReplacingKey = <
  V,
  O extends Record<string, V> = Record<string, V>,
>(
    object: O,
    key: string,
    value: V,
  ): O => {
  console.log('immutableObjReplacingKey: add <' + key + '> with val: ', value);
  return !value ? immutableObjWithoutKeyIfExists<O>(
    object,
    key,
    'immutableObjReplacingKey',
  ) : { ...object, [key]: value };
};

export const immutableGetReversedArr = <T extends unknown = any>(
  array: T[],
): T[] => {
  const copy = [...array];
  copy.reverse();
  return copy;
};

export const orderAndLimit = (
  object: OrderbookOrdersSortedObject,
  limit = 10,
  orderBy: 'asc' | 'desc' = 'asc',
): WebSocketOrderbookDataArray => {
  const array = Object.entries(object)
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
  }
  else {
    return groupBy % 2 === 0 ? 2 : 2.5;
  }
};
