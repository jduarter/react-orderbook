export type UseGenericTimerCallbackKind = [
  // eslint-disable-next-line no-restricted-globals
  typeof setTimeout | typeof setInterval,
  // eslint-disable-next-line no-restricted-globals
  typeof clearTimeout | typeof clearInterval,
];

export interface TimerHandler {
  start: () => void;
  finish: () => void;
  isStarted: () => boolean;
}
