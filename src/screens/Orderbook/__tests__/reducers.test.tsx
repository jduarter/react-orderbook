import { reduceKeyPairToState } from '../reducers';

import type { OrderbookOrdersSortedObject } from '../types';
// import type { WebSocketOrderbookDataArray } from '../../../hooks/useWebSocket';

type TestFnArgsType<T = OrderbookOrdersSortedObject> = [
  Array<[number, number]>, // updates
  T, // initialState
];

type TestFnType<R extends any, A extends TestFnArgsType = TestFnArgsType> = (...args: A) => R; // ñ) R;

const callFn = <R extends any, A extends TestFnArgsType = TestFnArgsType>(
  fn: TestFnType<R, A>,
  testArgs: A,
) => fn(...testArgs) as R;

const callFnAsync = async <R extends any, A extends TestFnArgsType = TestFnArgsType>(
  fn: TestFnType<R, A>,
  testArgs: A,
): Promise<R> => {
  return fn(...testArgs);
};
type ThisTestcaseRecord = TestcaseRecord<OrderbookOrdersSortedObject>;

interface TestcaseRecord<RT = Record<number | string, any>> {
  args: TestFnArgsType;
  expectsResult: RT;
  name: string;
}

const TESTCASE_1: ThisTestcaseRecord = {
  name: 'testcase 1',
  args: [[[38488.5, 540]], {}], // { data: [[38488.5, 540]], initialState: {} },
  expectsResult: { '3848850': 540 },
};

const TESTCASE_2: ThisTestcaseRecord = {
  name: 'testcase 2',
  args: [[[38400, 540]], {}],

  expectsResult: { '3840000': 540 },
};

const TESTCASE_3: ThisTestcaseRecord = {
  name: 'testcase 3',
  args: [
    [
      [37880, 0],
      [37885, 15000],
      [38310.5, 19819],
      [38327.5, 8081],
      [38582, 13954],
      [38594.5, 10000],
      [38602, 0],
      [38606, 0],
      [38611.5, 0],
      [38620.5, 8965],
      [38629, 0],
      [38632, 0],
      [38634.5, 0],
    ],
    {},
  ],
  expectsResult: {},
};

const TESTCASES = [TESTCASE_1, TESTCASE_2];

describe('screens(Orderbook): hook(reduceKeyPairToState): tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  TESTCASES.forEach((tc): void => {
    it(tc.name, async () =>
      expect(callFn<OrderbookOrdersSortedObject>(reduceKeyPairToState, tc.args)).toEqual(
        tc.expectsResult,
      ),
    );
  });
});
