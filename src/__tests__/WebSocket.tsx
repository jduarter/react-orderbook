// @ts-nocheck

import 'react-native';
import React from 'react';

import { render, act as tlAct, cleanup } from '@testing-library/react-native';

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

describe('main WebSocket test', () => {
  const controlPromise = getControlledPromise();
  let app = null;
  beforeEach(() => {
    server = new WS('ws://localhost:42018');

    server.on('connection', () => {
      console.log('CLIENT CONNECTED TO FAKE SERVER');
      controlPromise.resolve();
    });

    app = render(<App />);
  });

  afterEach(() => {
    cleanup();
    app = null;
    WS.clean();
    jest.resetAllMocks();
  });

  it('renders <App /> correctly and connects to websocket server in subsequent renders', async () => {
    await tlAct(async () => controlPromise.promise);
    await tlAct(async () => server.connected);
    return tlAct(async () => app.unmount());
  });
});
