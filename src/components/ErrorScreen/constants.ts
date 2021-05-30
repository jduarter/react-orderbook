export const ERROR_TYPES: Record<string, symbol> = {
  INTERNET_IS_UNAVAILABLE: Symbol('INTERNET_IS_UNAVAILABLE'),
  SERVICE_IS_UNAVAILABLE: Symbol('SERVICE_IS_UNAVAILABLE'),
};

export const ERROR_TITLES: Map<symbol, string> = new Map([
  [ERROR_TYPES.INTERNET_IS_UNAVAILABLE, 'Internet seems to be unavailable.'],
  [ERROR_TYPES.SERVICE_IS_UNAVAILABLE, 'Service is not available.'],
]);
