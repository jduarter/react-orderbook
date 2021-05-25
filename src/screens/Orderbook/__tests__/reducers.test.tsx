/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                               *
 *                    | react-native-orderbook |                 *
 *                                                               *
 *  License |  MIT General Public License                        *
 *  Author  |  Jorge Duarte Rodríguez <info@malagadev.com>       *
 *                                                               *
 *                            (c) 2021                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
import { reduceKeyPairToState } from '../reducers';

import type { OrderbookOrdersSortedObject } from '../types';
// import type { WebSocketOrderbookDataArray } from '../../../hooks/useWebSocket';

type TestFunctionArgumentsType<T = OrderbookOrdersSortedObject> = [
  [number, number][], // updates
  T, // initialState
];

type TestFunctionType<R extends any, A extends TestFunctionArgumentsType = TestFunctionArgumentsType> = (...arguments_: A) => R; // ñ) R;

const callFunction = <R extends any, A extends TestFunctionArgumentsType = TestFunctionArgumentsType>(
  function_: TestFunctionType<R, A>,
  testArguments: A,
) => function_(...testArguments) as R;

const callFunctionAsync = async <R extends any, A extends TestFunctionArgumentsType = TestFunctionArgumentsType>(
  function_: TestFunctionType<R, A>,
  testArguments: A,
): Promise<R> => {
  return function_(...testArguments);
};
type ThisTestcaseRecord = TestcaseRecord<OrderbookOrdersSortedObject>;

interface TestcaseRecord<RT = Record<number | string, any>> {
  args: TestFunctionArgumentsType;
  expectsResult: RT;
  name: string;
}

const TESTCASE_1: ThisTestcaseRecord = {
  name: 'testcase 1',
  args: [[[38_488.5, 540]], {}], // { data: [[38488.5, 540]], initialState: {} },
  expectsResult: { 3_848_850: 540 },
};

const TESTCASE_2: ThisTestcaseRecord = {
  name: 'testcase 2',
  args: [[[38_400, 540]], {}],

  expectsResult: { 3_840_000: 540 },
};

const TESTCASE_3: ThisTestcaseRecord = {
  name: 'testcase 3',
  args: [
    [
      [37_880, 0],
      [37_885, 15_000],
      [38_310.5, 19_819],
      [38_327.5, 8081],
      [38_582, 13_954],
      [38_594.5, 10_000],
      [38_602, 0],
      [38_606, 0],
      [38_611.5, 0],
      [38_620.5, 8965],
      [38_629, 0],
      [38_632, 0],
      [38_634.5, 0],
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

  for (const tc of TESTCASES) {
    it(tc.name, async () =>
      expect(callFunction<OrderbookOrdersSortedObject>(reduceKeyPairToState, tc.args)).toEqual(
        tc.expectsResult,
      ),
    );
  }
});
