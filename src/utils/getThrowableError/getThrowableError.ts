import type {
  ThrowableErrorConstructorArguments,
  DefaultConstructorGeneratorReturn,
  ThrowableErrorConstructor,
} from './types';

export class ThrowableError<N> extends Error {
  [k: string]: any;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  name: N;

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  message: string;
}

type OmitFromThrowableErrorForExtends = 'captureStackTrace' | 'stackTraceLimit';

type ExtendFromType<N, A extends [] = any> = Omit<
  typeof ThrowableError,
  OmitFromThrowableErrorForExtends
> &
  ThrowableErrorConstructor<A, ThrowableError<N>>;

export const getThrowableError = <
  N extends string = string,
  A extends ThrowableErrorConstructorArguments = ThrowableErrorConstructorArguments,
  CGR extends DefaultConstructorGeneratorReturn = DefaultConstructorGeneratorReturn,
>(
  name: N,
  fn: (...args: A) => CGR,
  extendFrom: ExtendFromType<any> = ThrowableError,
): ThrowableErrorConstructor<A, ThrowableError<N>> => {
  const e = new extendFrom();
  const Err = Object.create(null);
  Err.name = name;
  Err.stack = e.stack;

  const ErrConstructor = function (
    this: ThrowableError<N>,
    ...args: A
  ): ThrowableError<N> {
    Error.call(this);
    Object.defineProperty(this, 'name', { value: name });

    const cc = fn(...args);
    for (const ck in cc) {
      const keynam: string = ck === 'userMessage' ? 'message' : ck;
      // eslint-disable-next-line security/detect-object-injection
      const v = cc[ck];
      this[keynam] = // eslint-disable-line security/detect-object-injection
        typeof v === 'object' // eslint-disable-line security/detect-object-injection
          ? Array.isArray(v) // eslint-disable-line security/detect-object-injection
            ? Array.from(v) // eslint-disable-line security/detect-object-injection
            : { ...v } // eslint-disable-line security/detect-object-injection
          : v; // eslint-disable-line security/detect-object-injection
    }

    return this;
  };

  Object.setPrototypeOf(ErrConstructor, Object.getPrototypeOf(extendFrom));
  Object.defineProperty(ErrConstructor, 'name', { value: name });
  ErrConstructor.prototype = Object.create(extendFrom.prototype, {
    constructor: {
      value: extendFrom,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });
  return ErrConstructor as ThrowableErrorConstructor<A, ThrowableError<N>> &
    typeof ErrConstructor;
};
