// @ts-nocheck

import 'react-native';
import React from 'react';

import { Text } from 'react-native';
import { render, act, cleanup, waitFor } from '@testing-library/react-native';
import { renderHook } from '@testing-library/react-hooks';

import useGeneratorQueue, { GeneratorQueueError } from './useGeneratorQueue';

describe('#useGeneratorQueue - basic integration in component', () => {
  let cInstance = null;
  const Comp = ({ gqOptions }) => {
    const q = useGeneratorQueue([], gqOptions);

    return <React.Fragment></React.Fragment>;
  };

  beforeEach(() => {
    cInstance = render(<Comp />);
  });

  afterEach(() => {
    cleanup();
    cInstance = null;
    jest.resetAllMocks();
  });

  it('renders hook test container', async () => {
    return act(async () => cInstance.unmount());
  });
});

const repeatCall = (times, fn) => {
  for (let i = 0; i < 16 + 1; i += 1) {
    fn(i);
  }
};

describe('#useGeneratorQueue - hook', () => {
  let cInstance = null;

  beforeEach(() => {
    jest.resetAllMocks();
    cInstance = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('doesnt allow a wrong (typeof n != number) value in queueMaxSize', async () => {
    const { result } = renderHook(() =>
      useGeneratorQueue([], {
        queueMaxSize: 'a',
        throwErrorOnMaxSizeReach: true,
      }),
    );

    expect(result.error instanceof GeneratorQueueError).toBeTruthy();
    expect(result.error.type === 'INVALID_HOOK_ARGS').toBeTruthy();
  });

  it('doesnt allow a wrong (n <= 0) value in queueMaxSize', async () => {
    const { result } = renderHook(() =>
      useGeneratorQueue([], {
        queueMaxSize: 0,
        throwErrorOnMaxSizeReach: true,
      }),
    );

    expect(result.error instanceof GeneratorQueueError).toBeTruthy();
    expect(result.error.type === 'INVALID_HOOK_ARGS').toBeTruthy();
  });

  it('doesnt allow a wrong (n <= 0) value in queueMaxSize', async () => {
    const { result } = renderHook(() =>
      useGeneratorQueue([], {
        queueMaxSize: -1,
        throwErrorOnMaxSizeReach: true,
      }),
    );

    expect(result.error instanceof GeneratorQueueError).toBeTruthy();
    expect(result.error.type === 'INVALID_HOOK_ARGS').toBeTruthy();
  });

  it('throws on max size reach', async () => {
    const { result: hookResult } = renderHook(() =>
      useGeneratorQueue([], {
        queueMaxSize: 16,
        throwErrorOnMaxSizeReach: true,
      }),
    );

    try {
      if (hookResult?.current?.dispatchToQ) {
        repeatCall(16 + 1, (i) => {
          hookResult.current.dispatchToQ([i]);
        });

        throw new Error('ErrorWasNotRaised');
      }
    } catch (err) {
      console.log(
        err,
        err.message,
        err.constructor,
        err.constructor.name,
        err.message,
      );
      expect(err instanceof GeneratorQueueError).toBeTruthy();
    }
  });

  it('no-options instance creation works', async () => {
    const { result } = renderHook(() => useGeneratorQueue());

    expect(typeof result?.current?.dispatchToQ).toEqual('function');
    expect(typeof result?.current?.consumeQ).toEqual('function');
    expect(result.error).toBeUndefined();
  });

  it('returns elements in expected order (no limit)', async () => {
    const hInstance = renderHook(() => useGeneratorQueue());
    const { dispatchToQ, consumeQ } = hInstance.result.current;

    dispatchToQ(['a', 'b']);
    dispatchToQ([]);
    dispatchToQ(['c']);

    hInstance.rerender();

    expect([...consumeQ(null)]).toEqual([['a', 'b', 'c']]);
    expect(hInstance.error).toBeUndefined();
  });

  it('returns elements in epected order (with limit)', async () => {
    const hInstance = renderHook(() => useGeneratorQueue());
    const { dispatchToQ, consumeQ } = hInstance.result.current;

    dispatchToQ(['a', 'b']);
    dispatchToQ([]);
    dispatchToQ(['c']);

    hInstance.rerender();

    expect([...consumeQ(1)]).toEqual([['a']]);
    expect([...consumeQ(4)]).toEqual([['b', 'c']]);
    expect(hInstance.error).toBeUndefined();
  });
});
