// @ts-nocheck

import { reduceKeyPairToState, mutateForGrouping } from '../reducers';

import {
  MUTATEFORGROUPING_TEST_SUITE,
  TESTCASES,
} from '../__mocks__/reducers-tests-mocks.ts';

import type { OrderbookOrdersSortedObject } from '../types';

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
/*
const callFunctionAsync = async <
    R extends any,
    A extends TestFunctionArgumentsType = TestFunctionArgumentsType,
>(
    fn: TestFunctionType<R, A>,
    testArguments: A,
): Promise<R> => {
    return fn(...testArguments);
};*/

const sobj2map = (o: Record<string, number>) => {
  const ou = new Map(
    Object.entries(o).map(([p, s]) => [Number(p) / Math.pow(10, 2), s]),
  );

  return ou;
};

describe('screens(Orderbook): hook(reduceKeyPairToState): tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  for (const tc of TESTCASES) {
    it(tc.name, async () =>
      expect(
        callFunction<OrderbookOrdersSortedObject>(
          reduceKeyPairToState,
          tc.args,
        ),
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
        updates,
        groupBy,
        sobj2map(initialExactState),
        sobj2map(initialGroupState),
      );

      return expect(groupsNewAbsoluteValues).toEqual(new Map(result));
    });
  }
});
