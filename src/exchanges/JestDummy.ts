import type { ExchangeModule } from '../screens/Orderbook/types';

const DEFAULT_OPTIONS = {
  uri: 'ws://localhost:42018',
  defaultProduct: {
    id: 'dummy',
    pairName: 'dummy',
    optimalIntReprPowFactor: 2,
    asset: {
      symbol: 'dummy',
      decimals: 8,
      decimalsToShow: 2,
    },
    price: {
      symbol: 'dummy',
      decimals: 2,
      decimalsToShow: 2,
    },
    groupByFactors: [0.01, 0.1, 1, 10, 50, 100],
  },
  groupBy: 0.01,
};

const JestDummy: ExchangeModule = {
  defaultOptions: DEFAULT_OPTIONS,

  onMessage: () => () => {},
  onOpen: () => () => {},
};

export default JestDummy;
