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

  originalError?: Error;
}

export const getThrowableError = <
  N extends string = string,
  A extends ThrowableErrorConstructorArguments = ThrowableErrorConstructorArguments,
  CGR extends DefaultConstructorGeneratorReturn = DefaultConstructorGeneratorReturn,
>(
  name: N,
  fn: (...args: A) => CGR,
): ThrowableErrorConstructor<A, ThrowableError<N>> => {
  const e = new ThrowableError();
  const Err = Object.create(null);
  Err.name = name;
  Err.stack = e.stack;

  const ErrConstructor = function _Constructor(
    this: ThrowableError<N>,
    ...args: A
  ): ThrowableError<N> {
    Object.setPrototypeOf(this, Object.create(ThrowableError.prototype));
    Error.call(this);

    this.name = name;

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

  ErrConstructor.name = name;

  return ErrConstructor as ThrowableErrorConstructor<A, ThrowableError<N>> &
    typeof ErrConstructor;
};
