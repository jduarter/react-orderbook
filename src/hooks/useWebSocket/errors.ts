import { getThrowableError } from 'throwable-error';

export const WebSocketError = getThrowableError('WebSocketError', {
  mapperFn: (userMessage: string, details?: { originalError?: Error }) => ({
    userMessage,
    originalError: details?.originalError || undefined,
  }),
});

type ErrorDetails = { originalError?: Error; data?: any };
export const WebSocketJSONError = getThrowableError<[string, ErrorDetails]>(
  'WebSocketJSONError',
  {
    mapperFn: (userMessage: string, details?: ErrorDetails) => ({
      userMessage,
      originalError: details?.originalError || undefined,
      data: details?.data || undefined,
    }),
    extendFrom: WebSocketError,
  },
);
