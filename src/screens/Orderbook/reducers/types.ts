import type { OrderbookGenericScopeDataType } from '../types';

export type GroupsMembersDiffType = OrderbookGenericScopeDataType<{
  created: number[];
  removed: number[];
}>;
