// @ts-nocheck

import { reduceMapToState } from '../reducers/common';
import { mutateForGrouping } from '../reducers/grouping';
import { orderAndLimit } from '../reducers';
import { toNormalizedMap } from '../utils';

import {
  MUTATEFORGROUPING_TEST_SUITE,
  TESTCASES,
  ORDERANDLIMIT_TEST_SUITE,
} from '../__mocks__/reducers-tests-mocks.ts';

import type { OrderbookOrdersSortedObject } from '../types';
import { orderAndLimit } from '../reducers';
import Decimal from 'decimal.js';

type TestFunctionArgumentsType<T = OrderbookOrdersSortedObject> = [
  [number, number][], // updates
  T, // initialState
];

type TestFunctionType<
  R extends any,
  A extends TestFunctionArgumentsType = TestFunctionArgumentsType,
> = (...arguments_: A) => R;

const callFunction = <
  R extends any,
  A extends TestFunctionArgumentsType = TestFunctionArgumentsType,
>(
  fn: TestFunctionType<R, A>,
  testArguments: A,
) => fn(...testArguments) as R;

const sobj2map = (o: Record<string, number>) =>
  toNormalizedMap(
    Object.entries(o).map(([p, s]) => [
      (Number(p) / Math.pow(10, 2)).toString(),
      s,
    ]),
    2,
  );

describe('screens(Orderbook): hook(reduceMapToState): tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  for (const tc of TESTCASES) {
    it(tc.name, async () =>
      expect(
        callFunction(reduceMapToState, [
          toNormalizedMap(tc.args[0], 2),
          tc.args[1],
        ]),
      ).toEqual(tc.expectsResult),
    );
  }
});

describe('(Orderbook): fn(mutateForGrouping): tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  for (const testIdx of MUTATEFORGROUPING_TEST_SUITE.keys()) {
    const [updates, groupBy, initialExactState, initialGroupState, result] =
      // eslint-disable-next-line security/detect-object-injection
      MUTATEFORGROUPING_TEST_SUITE[testIdx];

    it('test index=' + testIdx, async () => {
      const [groupsNewAbsoluteValues] = mutateForGrouping(
        toNormalizedMap(updates, 2),
        groupBy,
        sobj2map(initialExactState),
        sobj2map(initialGroupState),
      );

      return expect(groupsNewAbsoluteValues).toEqual(
        toNormalizedMap(result, 2),
      );
    });
  }
});

describe('(Orderbook): fn(orderAndLimit): tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  for (const testIdx of ORDERANDLIMIT_TEST_SUITE.keys()) {
    const [array, limit, orderBy, result] =
      // eslint-disable-next-line security/detect-object-injection
      ORDERANDLIMIT_TEST_SUITE[testIdx];

    it('test index=' + testIdx, async () => {
      const orderMap = new Map(
        [...array].map((e, k) => [e[0], new Decimal(e[1])]),
      );

      const fResult = orderAndLimit(orderMap, limit, orderBy);

      return fResult.map((e, idx) => {
        const a = [e[0], e[1].toFixed(2), e[2].toFixed(2), e[3]];
        const b = result[idx];
        return expect(a).toEqual(b);
      }); // expect(fResult).toEqual(result)
    });
  }
});
