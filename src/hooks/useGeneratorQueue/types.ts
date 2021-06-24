export type UseGeneratorQueuePayload<T> = T[];

export type UseGeneratorQueueDispatch<T> = (
  payload: UseGeneratorQueuePayload<T>,
) => void;

export type GetSingleUpdateFunction<T> = (
  limit: number | null,
) => Iterable<T[]>;

export interface UseGeneratorQueueReturn<T> {
  dispatchToQ: UseGeneratorQueueDispatch<T>;
  consumeQ: GetSingleUpdateFunction<T>;
}

export interface GeneratorQueueOptions {
  queueMaxSize: number;
  throwErrorOnMaxSizeReach: boolean;
  kind: 'FIFO';
}

export interface ErrorDetails {
  [k: string]: any;
  originalError?: Error;
}

export type ErrorArgs = [string] | [string, ErrorDetails | undefined];
