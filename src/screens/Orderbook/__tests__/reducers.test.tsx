import { reduceKeyPairToState, mutateForGrouping } from '../reducers';

import type { OrderbookOrdersSortedObject } from '../types';
// import type { WebSocketOrderbookDataArray } from '../../../hooks/useWebSocket';

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

/*const TESTCASE_3: ThisTestcaseRecord = {
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
};*/

const TEST_MUTATEFORGROUPING_XLIS_1 = {
    '3910000': 30000,
    '3950000': 275329,
    '3980000': 269292,
    '3990000': 551552,
};

const TEST_MUTATEFORGROUPING_UPDATES_1 = [
    [39891.5, 1500],
    [39892, 0],
    [39894, 10000],
];

const TEST_MUTATEFORGROUPING_XLN_1 = { '3989150': 1979, '3989400': 10000 };

const TEST_MUTATEFORGROUPING_XLO_1 = { '3989150': 1979, '3989400': 10000 };

const TEST_MUTATEFORGROUPING_RESULT_1 = [
    [39100, 30000],
    [39500, 275329],
    [39800, 268813],
    [39900, 551552],
];

/**  _.-""""`-._ 
   ,' _-""""`-_ `.
  / ,'.-'"""`-.`. \
 | / / ,'"""`. \ \ |
| | | | ,'"`. | | | |
| | | | |   | | | | |
 */
const TEST_MUTATEFORGROUPING_XLIS_2 = {
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

const TEST_MUTATEFORGROUPING_XLN_2 = { '3989150': 1979, '3989400': 10000 };

const TEST_MUTATEFORGROUPING_XLO_2 = { '3989150': 1979, '3989400': 10000 };

const TEST_MUTATEFORGROUPING_RESULT_2 = [
    [32000, 123],
    [36800, 123],
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

const TEST_MUTATEFORGROUPING_XLIS_3 = {
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

const TEST_MUTATEFORGROUPING_XLN_3 = { '3989150': 1979, '3989400': 10000 };

const TEST_MUTATEFORGROUPING_XLO_3 = { '3989150': 1979, '3989400': 10000 };

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

const TEST_MUTATEFORGROUPING_XLIS_4 = {
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

const TEST_MUTATEFORGROUPING_XLN_4 = { '3989150': 1979, '3989400': 10000 };

const TEST_MUTATEFORGROUPING_XLO_4 = { '3989150': 1979, '3989400': 10000 };

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
const TEST_MUTATEFORGROUPING_XLIS_5 = {
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

const TEST_MUTATEFORGROUPING_XLN_5 = { '3989150': 1979, '3989400': 10000 };

const TEST_MUTATEFORGROUPING_XLO_5 = { '3989150': 1979, '3989400': 10000 };

const TEST_MUTATEFORGROUPING_RESULT_5 = [
    [39000, 20],
    [39100, 30000],
    [39500, 275329],
    [39800, 269295],
    [39900, 551552],
];

/**  _.-""""`-._ 
   ,' _-""""`-_ `.
  / ,'.-'"""`-.`. \
 | / / ,'"""`. \ \ |
| | | | ,'"`. | | | |
| | | | |   | | | | |
 */

const TEST_MUTATEFORGROUPING_XLIS_6 = {
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

const TEST_MUTATEFORGROUPING_XLN_6 = { '3989150': 1979, '3989400': 10000 };

const TEST_MUTATEFORGROUPING_XLO_6 = { '3989150': 1979, '3989400': 10000 };

const TEST_MUTATEFORGROUPING_RESULT_6 = [
    [39000, 20],
    [39100, 30000],
    [39500, 275329],
    [39800, 267313],
    [39900, 551552],
];

const TEST_MUTATEFORGROUPING_XLIS_7 = {
    '3810000': 1805302,
    '3940000': 60000,
    '3970000': 4229,
    '3980000': 807096,
    '4000000': 882717,
    '4010000': 880004,
    '4020000': 1434,
};

const TEST_MUTATEFORGROUPING_XLN_7 = {
    '4013600': 2076,
    '4018600': 2445,
    '4020650': 5340,
};
const TEST_MUTATEFORGROUPING_XLO_7 = {
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
    [39800, 807096],
    [40000, 882717],
    [40100, 875941],
    [40200, -18906],
];

const TEST_MUTATEFORGROUPING_XLIS_8 = {
    '3840000': 60000,
    '3880000': 20749,
    '3900000': 1207297,
    '3910000': 966698,
    '3920000': 1266933,
};

const TEST_MUTATEFORGROUPING_UPDATES_8 = [
    [38826, 31867],
    [38845.5, 0],
    [38846, 0],
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

const TEST_MUTATEFORGROUPING_XLN_8 = {
    '3882600': 31867,
    '3916550': 199,
    '3916600': 10000,
    '3917750': 43213,
    '3918300': 199,
    '3920500': 150000,
    '3923150': 1945,
    '3923550': 100,
    '3924650': 20000,
};

const TEST_MUTATEFORGROUPING_XLO_8 = {
    '3882600': 31867,
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
    [38800, 42985],
    [39000, 1207297],
    [39100, 1020309],
    [39200, 1262935],
];

const TEST_MUTATEFORGROUPING_XLIS_9 = {
    '3880000': 1605854,
    '3890000': 2400159,
    '3910000': 839823,
    '3920000': 106382,
    '3950000': 15000,
    '4090000': 998492,
};

const TEST_MUTATEFORGROUPING_UPDATES_9 = [
    [38812, 20000],
    [38813, 10000],
    [38814, 0],
    [38814.5, 0],
    [38834, 1968],
    [38839.5, 2077],
    [38856, 57709],
    [38861, 0],
    [38872.5, 122633],
    [38875.5, 0],
    [38877.5, 1999],
    [38880, 150000],
    [38889, 234389],
    [38905, 47],
    [38905.5, 1959],
    [38907, 751502],
    [38979.5, 481860],
    [38980.5, 0],
    [39182.5, 690297],
    [39183.5, 0],
    [39239, 0],
    [39579.5, 15000],
    [39580, 0],
    [40999.5, 998396],
];
const TEST_MUTATEFORGROUPING_XLN_9 = {
    '3881200': 20000,
    '3881300': 10000,
    '3883400': 1968,
    '3883950': 2077,
    '3885600': 57709,
    '3887250': 122633,
    '3887750': 1999,
    '3888000': 150000,
    '3888900': 234389,
    '3890500': 47,
    '3890550': 1959,
    '3890700': 751502,
    '3897950': 481860,
    '3918250': 690297,
    '3957950': 15000,
    '4099950': 998396,
};
const TEST_MUTATEFORGROUPING_XLO_9 = {
    '3881400': 20000,
    '3881450': 30000,
    '3883400': 350,
    '3886100': 62366,
    '3887550': 150000,
    '3887750': 267836,
    '3890500': 750049,
    '3890550': 271908,
    '3898050': 477999,
    '3918250': 6165,
    '3918350': 683654,
    '3923900': 106487,
    '3958000': 30000,
    '4099950': 998492,
};

const TEST_MUTATEFORGROUPING_RESULT_9 = [
    [38800, 1676077],
    [38900, 2135571],
    [39100, 840301],
    [39200, -105],
    [39500, 15000],
    [40900, 998396],
];

const X = [
    /*    [39178, 0],
    [39180, 0],
    [39180.5, 0],
 */ [39891.5, 1979],
    [39892, 0],
    [39894, 10000],
    /*   [39910.5, 9079],
    [39925.5, 0],
    [39926.5, 150000],
    [39929.5, 0],
    [39930.5, 0],
    [39932, 0],
    [39934.5, 0],
    [39935, 0],
    [39938.5, 20000],
    [39939, 0],
    [39940.5, 1968],
    [39942, 65953],
    [39942.5, 12497],
    [39943, 0],
    [39946, 8784],
    [39949, 0],
    [39952.5, 0],
    [39953, 0],
    [39953.5, 30000],
    [39954, 0],
    [39954.5, 0],
    [39955, 10000],
    [39956, 5000],
    [39957, 15000],
    [39960.5, 801],
    [39961.5, 0],
    [39966.5, 50],*/
];

const XLN = {
    '3989150': 1979,
    '3989400': 10000,
    /*   '3991050": 9079,
    "3992650": 150000,
    "3993850": 20000,
    "3994050": 1968,
    "3994200": 65953,
    "3994250": 12497,
    "3994600": 8784,
    "3995350": 30000,
    "3995500": 10000,
    "3995600": 5000,
    "3995700": 15000,
    "3996050": 801,
    "3996650": 50,*/
};

const XLO = {
    '3989150': 1979,
    '3989400': 10000,
    /*   '3991050": 9079,
    "3992650": 150000,
    "3993850": 20000,
    "3994050": 1968,
    "3994200": 65953,
    "3994250": 12497,
    "3994600": 8784,
    "3995350": 30000,
    "3995500": 10000,
    "3995600": 5000,
    "3995700": 15000,
    "3996050": 801,
    "3996650": 50,*/
};

const XLIS = {
    //  '3900000': 1,
    '3910000': 30000,
    '3950000': 275329,
    '3980000': 269292,
    '3990000': 551552,
};

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
        const c = mutateForGrouping(
            TEST_MUTATEFORGROUPING_UPDATES_1,
            100,
            TEST_MUTATEFORGROUPING_XLO_1,
            TEST_MUTATEFORGROUPING_XLN_1,
            TEST_MUTATEFORGROUPING_XLIS_1,
        );

        return expect(c).toEqual(TEST_MUTATEFORGROUPING_RESULT_1);
    });

    console.log('test 2');
    it('test 2', async () => {
        const c = mutateForGrouping(
            TEST_MUTATEFORGROUPING_UPDATES_2,
            100,
            TEST_MUTATEFORGROUPING_XLO_2,
            TEST_MUTATEFORGROUPING_XLN_2,
            TEST_MUTATEFORGROUPING_XLIS_2,
        );

        return expect(c).toEqual(TEST_MUTATEFORGROUPING_RESULT_2);
    });

    console.log('test 3');
    it('test 3 ', async () => {
        const c = mutateForGrouping(
            TEST_MUTATEFORGROUPING_UPDATES_3,
            100,
            TEST_MUTATEFORGROUPING_XLO_3,
            TEST_MUTATEFORGROUPING_XLN_3,
            TEST_MUTATEFORGROUPING_XLIS_3,
        );

        return expect(c).toEqual(TEST_MUTATEFORGROUPING_RESULT_3);
    });

    console.log('test 4');
    it('test 4 ', async () => {
        const c = mutateForGrouping(
            TEST_MUTATEFORGROUPING_UPDATES_4,
            100,
            TEST_MUTATEFORGROUPING_XLO_4,
            TEST_MUTATEFORGROUPING_XLN_4,
            TEST_MUTATEFORGROUPING_XLIS_4,
        );

        return expect(c).toEqual(TEST_MUTATEFORGROUPING_RESULT_4);
    });

    console.log('test 5');
    it('test 5 ', async () => {
        const c = mutateForGrouping(
            TEST_MUTATEFORGROUPING_UPDATES_5,
            100,
            TEST_MUTATEFORGROUPING_XLO_5,
            TEST_MUTATEFORGROUPING_XLN_5,
            TEST_MUTATEFORGROUPING_XLIS_5,
        );

        return expect(c).toEqual(TEST_MUTATEFORGROUPING_RESULT_5);
    });

    console.log('test 6');

    it('test 6 ', async () => {
        const c = mutateForGrouping(
            TEST_MUTATEFORGROUPING_UPDATES_6,
            100,
            TEST_MUTATEFORGROUPING_XLO_6,
            TEST_MUTATEFORGROUPING_XLN_6,
            TEST_MUTATEFORGROUPING_XLIS_6,
        );

        return expect(c).toEqual(TEST_MUTATEFORGROUPING_RESULT_6);
    });

    it('test 7 ', async () => {
        const c = mutateForGrouping(
            TEST_MUTATEFORGROUPING_UPDATES_7,
            100,
            TEST_MUTATEFORGROUPING_XLO_7,
            TEST_MUTATEFORGROUPING_XLN_7,
            TEST_MUTATEFORGROUPING_XLIS_7,
        );

        return expect(c).toEqual(TEST_MUTATEFORGROUPING_RESULT_7);
    });

    it('test 8 ', async () => {
        const c = mutateForGrouping(
            TEST_MUTATEFORGROUPING_UPDATES_8,
            100,
            TEST_MUTATEFORGROUPING_XLO_8,
            TEST_MUTATEFORGROUPING_XLN_8,
            TEST_MUTATEFORGROUPING_XLIS_8,
        );

        return expect(c).toEqual(TEST_MUTATEFORGROUPING_RESULT_8);
    });

    it('test 9 ', async () => {
        const c = mutateForGrouping(
            TEST_MUTATEFORGROUPING_UPDATES_9,
            100,
            TEST_MUTATEFORGROUPING_XLO_9,
            TEST_MUTATEFORGROUPING_XLN_9,
            TEST_MUTATEFORGROUPING_XLIS_9,
        );

        return expect(c).toEqual(TEST_MUTATEFORGROUPING_RESULT_9);
    });

    it('test A', async () => {
        const c = mutateForGrouping(X, 100, XLO, XLN, XLIS);
        return expect(c).toEqual([
            /*   [39100, 0],
            [39500, 275329],
            [39800, 271271],
            [39900, 192072],
       */ [39100, 30000],
            [39500, 275329],
            [39800, 269292],
            [39900, 551552],
        ]);
    });
});
