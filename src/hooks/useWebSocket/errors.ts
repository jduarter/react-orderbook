import { getThrowableError } from 'throwable-error';

import type { ThrowableErrorConstructorArguments } from 'throwable-error';

export const WebSocketError = getThrowableError(
  'WebSocketError',
  (userMessage: string, details?: { originalError?: Error }) => ({
    userMessage,
    originalError: details?.originalError || undefined,
  }),
);

export const WebSocketJSONError = getThrowableError<
  'WebSocketJSONError',
  ThrowableErrorConstructorArguments & [string, { data: any }]
>(
  'WebSocketJSONError',
  (userMessage: string, details?: { originalError?: Error; data?: any }) => ({
    userMessage,
    originalError: details?.originalError || undefined,
    data: details?.data || undefined,
  }),
  WebSocketError,
);
