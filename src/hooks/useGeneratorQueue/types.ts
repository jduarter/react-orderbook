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
