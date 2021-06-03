// @ts-nocheck

import 'react-native';
import React from 'react';

import { create, act } from 'react-test-renderer';

jest.mock('react-native-orientation-locker');
jest.mock('react-native-config');
jest.mock('@react-spring/native');

import WS from 'jest-websocket-mock';
import App from '../app';

let server: WS;

const getControlledPromise = () => {
  const promiseCtl = {};
  const promise = new Promise((resolve, reject) => {
    promiseCtl.resolve = () => resolve();
    promiseCtl.reject = () => reject();
  });
  return { promise, ...promiseCtl };
};

const controlPromise = getControlledPromise();

beforeEach(() => {
  server = new WS('ws://localhost:42018');

  server.on('connection', () => {
    controlPromise.resolve();
  });
});

afterEach(() => {
  WS.clean();
});

it('renders <App /> correctly and connects to websocket server in subsequent renders', async () => {
  const app = create(<App />);
  await act(async () => controlPromise.promise);
  await act(async () => server.connected);
  return act(async () => app.unmount());
});
