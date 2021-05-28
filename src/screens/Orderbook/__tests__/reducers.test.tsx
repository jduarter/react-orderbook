// @ts-nocheck
/* eslint quote-props:0 */

import { reduceKeyPairToState, mutateForGrouping } from '../reducers';

import type { OrderbookOrdersSortedObject } from '../types';

type TestFunctionArgumentsType<T = OrderbookOrdersSortedObject> = [
  [number, number][], // updates
  T, // initialState
];

type TestFunctionType<
  R extends any,
  A extends TestFunctionArgumentsType = TestFunctionArgumentsType,
> = (...arguments_: A) => R; // ñ) R;

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
type ThisTestcaseRecord = TestcaseRecord<OrderbookOrdersSortedObject>;

interface TestcaseRecord<RT = Record<number | string, any>> {
  args: TestFunctionArgumentsType;
  expectsResult: RT;
  name: string;
}

const TESTCASE_1: ThisTestcaseRecord = {
  name: 'testcase 1',
  args: [[[38488.5, 540]], {}], // { data: [[38488.5, 540]], initialState: {} },
  expectsResult: { 3848850: 540 },
};

const TESTCASE_2: ThisTestcaseRecord = {
  name: 'testcase 2',
  args: [[[38400, 540]], {}],

  expectsResult: { 3840000: 540 },
};

const TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_1 = {
  '3910000': 30000,
  '3980000': 269292,
};

const TEST_MUTATEFORGROUPING_UPDATES_1 = [
  [39891.5, 1500],
  [39892, 0],
  [39894, 10000],
];

const TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_1 = {
  '3989150': 1979,
  '3989400': 10000,
};

const TEST_MUTATEFORGROUPING_RESULT_1 = [
  [39100, 30000],
  [39800, 268813],
];

/**  _.-""""`-._
   ,' _-""""`-_ `.
  / ,'.-'"""`-.`. \
 | / / ,'"""`. \ \ |
| | | | ,'"`. | | | |
| | | | |   | | | | |
 */
const TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_2 = {
  '3910000': 30000,
  '3950000': 275329,
  '3980000': 269213,
  '3990000': 551552,
};

const TEST_MUTATEFORGROUPING_UPDATES_2 = [
  [36891.5, 123],
  [32000, 123],
  [39891.5, 1900],
  [39892, 1],
  [39894, 10000],
];

const TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_2 = {
  '3989150': 1979,
  '3989400': 10000,
};

const TEST_MUTATEFORGROUPING_RESULT_2 = [
  [39100, 30000],
  [39500, 275329],
  [39800, 269135],
  [39900, 551552],
];
/**  _.-""""`-._
   ,' _-""""`-_ `.
  / ,'.-'"""`-.`. \
 | / / ,'"""`. \ \ |
| | | | ,'"`. | | | |
| | | | |   | | | | |
 */

const TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_3 = {
  '3900000': 1979,
  '3910000': 30000,
  '3950000': 275329,
  '3980000': 269292,
  '3990000': 551552,
};
const TEST_MUTATEFORGROUPING_UPDATES_3 = [
  [39891.5, 1900],
  [39892, 0],
  [39894, 10000],
];

const TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_3 = {
  '3989150': 1979,
  '3989400': 10000,
};

const TEST_MUTATEFORGROUPING_RESULT_3 = [
  [39000, 1979],
  [39100, 30000],
  [39500, 275329],
  [39800, 269213],
  [39900, 551552],
];
/**  _.-""""`-._
   ,' _-""""`-_ `.
  / ,'.-'"""`-.`. \
 | / / ,'"""`. \ \ |
| | | | ,'"`. | | | |
| | | | |   | | | | |
 */

const TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_4 = {
  '3900000': 5,
  '3910000': 30000,
  '3950000': 275329,
  '3980000': 269292,
  '3990000': 551552,
};

const TEST_MUTATEFORGROUPING_UPDATES_4 = [
  [39891.5, 10],
  [39892, 0],
  [39894, 10000],
];

const TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_4 = {
  '3989150': 1979,
  '3989400': 10000,
};

const TEST_MUTATEFORGROUPING_RESULT_4 = [
  [39000, 5],
  [39100, 30000],
  [39500, 275329],
  [39800, 267323],
  [39900, 551552],
];

/**  _.-""""`-._
   ,' _-""""`-_ `.
  / ,'.-'"""`-.`. \
 | / / ,'"""`. \ \ |
| | | | ,'"`. | | | |
| | | | |   | | | | |
 */
const TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_5 = {
  '3900000': 20,
  '3910000': 30000,
  '3950000': 275329,
  '3980000': 267326,
  '3990000': 551552,
};

const TEST_MUTATEFORGROUPING_UPDATES_5 = [
  [39891.5, 10],
  [39892, 3],
  [39894, 10000],
];

const TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_5 = {
  '3989150': 1979,
  '3989400': 10000,
};

const TEST_MUTATEFORGROUPING_RESULT_5 = [
  [39000, 20],
  [39100, 30000],
  [39500, 275329],
  [39800, 267326 - 1969 + 3],
  [39900, 551552],
];

/**  _.-""""`-._
   ,' _-""""`-_ `.
  / ,'.-'"""`-.`. \
 | / / ,'"""`. \ \ |
| | | | ,'"`. | | | |
| | | | |   | | | | |
 */

const TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_6 = {
  '3900000': 20,
  '3910000': 30000,
  '3950000': 275329,
  '3980000': 269292,
  '3990000': 551552,
};

const TEST_MUTATEFORGROUPING_UPDATES_6 = [
  [39891.5, 0],
  [39892, 0],
  [39894, 10000],
];

const TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_6 = {
  '3989150': 1979,
  '3989400': 10000,
};

const TEST_MUTATEFORGROUPING_RESULT_6 = [
  [39000, 20],
  [39100, 30000],
  [39500, 275329],
  [39800, 267313],
  [39900, 551552],
];

/**  _.-""""`-._
   ,' _-""""`-_ `.
  / ,'.-'"""`-.`. \
 | / / ,'"""`. \ \ |
| | | | ,'"`. | | | |
| | | | |   | | | | |
 */

const TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_7 = {
  '3810000': 1805302,
  '3940000': 60000,
  '3970000': 4229,
  '3980000': 807096,
  '4000000': 882717,
  '4010000': 880004,
  '4020000': 1434,
};

const TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_7 = {
  '4013600': 2076,
  '4018600': 2445,
  '4020650': 5340,
};

const TEST_MUTATEFORGROUPING_UPDATES_7 = [
  [39708, 0],
  [40100.5, 0],
  [40136, 2076],
  [40168, 0],
  [40176, 0],
  [40181, 0],
  [40186, 2445],
  [40206.5, 5340],
];

const TEST_MUTATEFORGROUPING_RESULT_7 = [
  [38100, 1805302],
  [39400, 60000],
  [39700, 4229],
  [39800, 807096],
  [40000, 882717],
  [40100, 880004],
  [40200, 1434],
];

/**  _.-""""`-._
   ,' _-""""`-_ `.
  / ,'.-'"""`-.`. \
 | / / ,'"""`. \ \ |
| | | | ,'"`. | | | |
| | | | |   | | | | |
 */

const TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_8 = {
  '3840000': 60000,
  '3880000': 20749,
  '3900000': 1207297,
  '3910000': 966698,
  '3920000': 1266933,
};

const TEST_MUTATEFORGROUPING_UPDATES_8 = [
  [38826, 31867],
  [38845.5, 0],
  [38846, 10],
  [39024.5, 0],
  [39163, 0],
  [39165.5, 199],
  [39166, 10000],
  [39166.5, 0],
  [39175, 0],
  [39177.5, 43213],
  [39182.5, 0],
  [39183, 199],
  [39199, 0],
  [39202, 0],
  [39205, 150000],
  [39207, 0],
  [39213, 0],
  [39229, 0],
  [39231.5, 1945],
  [39235.5, 100],
  [39246.5, 20000],
  [39251.5, 0],
];

const TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_8 = {
  '3882600': 31867,
  '3884600': 100,
  '3916550': 199,
  '3916600': 10000,
  '3917750': 43213,
  '3918300': 199,
  '3920500': 150000,
  '3923150': 1945,
  '3923550': 100,
  '3924650': 20000,
};

const TEST_MUTATEFORGROUPING_RESULT_8 = [
  [38400, 60000],
  [38800, TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_8['3880000'] - 0 - 90],
  [39000, 1207297],
  [39100, 966698],
  [39200, 1266933],
];

const TESTCASES = [TESTCASE_1, TESTCASE_2];

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

  console.log('test 1');
  it('test 1', async () => {
    const [groupsNewAbsoluteValues, mainNewAbsoluteValues] = mutateForGrouping(
      TEST_MUTATEFORGROUPING_UPDATES_1,
      100,
      TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_1,
      TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_1,
    );

    return expect(groupsNewAbsoluteValues).toEqual(
      TEST_MUTATEFORGROUPING_RESULT_1,
    );
  });

  console.log('test 2');
  it('test 2', async () => {
    const [groupsNewAbsoluteValues, mainNewAbsoluteValues] = mutateForGrouping(
      TEST_MUTATEFORGROUPING_UPDATES_2,
      100,
      TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_2,
      TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_2,
    );

    return expect(groupsNewAbsoluteValues).toEqual(
      TEST_MUTATEFORGROUPING_RESULT_2,
    );
  });

  console.log('test 3');
  it('test 3 ', async () => {
    const [groupsNewAbsoluteValues, mainNewAbsoluteValues] = mutateForGrouping(
      TEST_MUTATEFORGROUPING_UPDATES_3,
      100,
      TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_3,
      TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_3,
    );

    return expect(groupsNewAbsoluteValues).toEqual(
      TEST_MUTATEFORGROUPING_RESULT_3,
    );
  });

  console.log('test 4');
  it('test 4 ', async () => {
    const [groupsNewAbsoluteValues, mainNewAbsoluteValues] = mutateForGrouping(
      TEST_MUTATEFORGROUPING_UPDATES_4,
      100,
      TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_4,
      TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_4,
    );

    return expect(groupsNewAbsoluteValues).toEqual(
      TEST_MUTATEFORGROUPING_RESULT_4,
    );
  });

  console.log('test 5');
  it('test 5 ', async () => {
    const [groupsNewAbsoluteValues, mainNewAbsoluteValues] = mutateForGrouping(
      TEST_MUTATEFORGROUPING_UPDATES_5,
      100,
      TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_5,
      TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_5,
    );

    return expect(groupsNewAbsoluteValues).toEqual(
      TEST_MUTATEFORGROUPING_RESULT_5,
    );
  });

  console.log('test 6');

  it('test 6 ', async () => {
    const [groupsNewAbsoluteValues, mainNewAbsoluteValues] = mutateForGrouping(
      TEST_MUTATEFORGROUPING_UPDATES_6,
      100,
      TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_6,
      TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_6,
    );

    return expect(groupsNewAbsoluteValues).toEqual(
      TEST_MUTATEFORGROUPING_RESULT_6,
    );
  });

  it('test 7 ', async () => {
    const [groupsNewAbsoluteValues, mainNewAbsoluteValues] = mutateForGrouping(
      TEST_MUTATEFORGROUPING_UPDATES_7,
      100,
      TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_7,
      TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_7,
    );

    return expect(groupsNewAbsoluteValues).toEqual(
      TEST_MUTATEFORGROUPING_RESULT_7,
    );
  });

  it('test 8 ', async () => {
    const [groupsNewAbsoluteValues, mainNewAbsoluteValues] = mutateForGrouping(
      TEST_MUTATEFORGROUPING_UPDATES_8,
      100,
      TEST_MUTATEFORGROUPING_INITIAL_EXACTSTATE_8,
      TEST_MUTATEFORGROUPING_INITIAL_GROUPSTATE_8,
    );

    return expect(groupsNewAbsoluteValues).toEqual(
      TEST_MUTATEFORGROUPING_RESULT_8,
    );
  });
});
