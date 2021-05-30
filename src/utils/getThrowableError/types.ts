export type ThrowableErrorConstructorArguments =
  | [string]
  | [string, { originalError?: Error }];

export interface DefaultConstructorGeneratorReturn {
  userMessage: string;
  originalError: Error | unknown;
}

export type ThrowableErrorConstructor<A extends any[], C> = new (
  ...args: A
) => C;
