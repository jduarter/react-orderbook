import { ERROR_TYPES } from './constants';

export interface ErrorScreenProps {
  errorType:
    | typeof ERROR_TYPES.INTERNET_IS_UNAVAILABLE
    | typeof ERROR_TYPES.SERVICE_IS_UNAVAILABLE;
}
