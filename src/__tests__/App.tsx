import 'react-native';
import * as React from 'react';

import TestRenderer from 'react-test-renderer';

jest.useFakeTimers();
const mockedUseEffect = jest.fn();
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: () => mockedUseEffect(),
}));

import App from '../app';

afterEach(() => {
  jest.resetAllMocks();
  jest.clearAllTimers();
});

it('renders correctly', () => {
  const testRenderer = TestRenderer.create(<App />);
  const testInstance = testRenderer.root;

  const mainView = testInstance.findByProps({ testID: 'MAIN_VIEW' });

  expect(() =>
    testInstance.findByProps({ testID: 'MAIN_ORDERBOOK_INSTANCE' }),
  ).not.toThrow();

  expect((mainView.children[0] as any).children[0].type.name).toEqual(
    'OrderbookComponent',
  );

  jest.runOnlyPendingTimers();

  expect(mockedUseEffect).toHaveBeenCalled();
});
