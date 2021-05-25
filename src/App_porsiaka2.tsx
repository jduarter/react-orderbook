/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import type { FC } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
  Platform,
} from 'react-native';

import { useTransition, config, useSpring, animated } from '@react-spring/native';

import { Colors } from 'react-native/Libraries/NewAppScreen';

import { useDebounce, useDebounceCallback } from '@react-hook/debounce';

import { useThrottle, useThrottleCallback } from '@react-hook/throttle';

const WEBSOCKET_URI = 'wss://www.cryptofacilities.com/ws/v1';

import * as NetInfo from './services/NetInfo';

import type {
  OrderbookWSMessageType,
  WebSocketOrderbookDataArray,
  WebSocketOrderbookSizePricePair,
} from './hooks/useWebSocket';
import { useWebSocket } from './hooks/useWebSocket';

const immutableObjWithoutKey = <O extends Record<string, any>>(obj: O, key: string): O => {
  // console.log('immutableObjWithoutKey: delete key <' + key + '>');
  const objCopy: O = { ...obj };
  delete objCopy[key];
  return objCopy;
};

const immutableObjWithoutKeyIfExists = <O extends Record<string, any>>(obj: O, key: string): O => {
  if (key in obj === false) {
    //  console.log('immutableObjWithoutKeyIfExists:  (key doesnt exist)');
    return obj;
  }
  return immutableObjWithoutKey(obj, key);
};

const immutableObjReplacingKey = <V, O extends Record<string, V> = Record<string, V>>(
  obj: O,
  key: string,
  val: V,
): O => {
  // console.log('immutableObjReplacingKey: add <' + key + '> with val: ', val);
  if (!val) {
    return immutableObjWithoutKeyIfExists<O>(obj, key);
  } else {
    return { ...obj, [key]: val };
  }
};

const immutableObjReplacingKeyWithSum = <
  V extends number = number,
  O extends Record<string, V> = Record<string, V>,
>(
  obj: O,
  key: string,
  delta: V,
  kDebugType = '*',
): O => {
  const existingValue = key in obj ? obj[key] : 0;
  const newVal = existingValue + delta;

  if (delta === 0) {
    //   console.log('             [i] ignorado 1: ' + key, { delta, existingValue, newVal });
    return immutableObjWithoutKeyIfExists<O>(obj, key);

    //    return { ...obj };
  }

  // console.log('immutableObjReplacingKeyWithSum called');
  /* const existingValue = key in obj ? obj[key] : undefined;

  if (!existingValue) {
    if (delta > 0) {
      console.log(
        'immutableObjReplacingKeyWithSum: update <' + key + '/' + kDebugType + '> with new val: ',
        delta,
        'old was: (undef)',
      );
      return { ...obj, [key]: delta };
    } else {
      return immutableObjWithoutKeyIfExists<O>(obj, key);
    }
  }
  */
  if (existingValue === newVal) {
    //  console.log('             [i] ignorado 2: ' + key, { delta, existingValue, newVal });
    return immutableObjWithoutKeyIfExists<O>(obj, key);
    //    return { ...obj };
  }

  if (!newVal) {
    /*   console.log(
      'immutableObjReplacingKeyWithSum: ** try to delete if it exists <' + key + '> with new val: ',
      delta,
      newVal,
      existingValue,
    );
*/
    return immutableObjWithoutKeyIfExists<O>(obj, key);
  } else {
    console.log(
      '     replace(<' +
        key +
        '>.' +
        kDebugType +
        '): from ' +
        existingValue +
        ' ->  ( + ' +
        delta +
        ') -> to ' +
        newVal +
        '>',
      //   obj,
    );

    if (newVal < existingValue) {
      console.log('             [i] decrece'); // : ', newVal - existingValue); // key + '.' + kDebugType);
    }

    return { ...obj, [key]: newVal };
  }
};

type OrderbookGroupedPrice = number;
type OrderbookNormalizedPrice = string;

const getGroupedPrice = (price: number, groupBy: number): OrderbookGroupedPrice =>
  Math.floor(price / groupBy) * groupBy;

const getNormalizedPrice = (input: number, decimals = 2): OrderbookNormalizedPrice => {
  const res = (Math.pow(10, decimals) * input).toString();
  //console.log('-> getNormalizedPrice(' + input + ') -> ', res);
  /**/
  return res;
};

const getPrintPriceForNormalizedPrice = (input: OrderbookNormalizedPrice, decimals = 2) =>
  _toLocaleString((parseFloat(input) / Math.pow(10, decimals)).toFixed(decimals));

const getNormalizedGroupedPrice = (
  price: number,
  groupBy: number,
  decimals = 2,
): OrderbookNormalizedPrice => {
  const ret = getNormalizedPrice(getGroupedPrice(price, groupBy), decimals);
  // console.log('getNormalizedGroupedPrice: ' + price + '(' + groupBy + ') : ', ret);

  return ret;
};

type OrderbookOrderSize = number;
type OrderbookOrdersSortedObject = Record<OrderbookNormalizedPrice, OrderbookOrderSize>;

const reduceKeyPairToState = <T extends Array<any> = WebSocketOrderbookDataArray>(
  data: T,
  initialState: OrderbookOrdersSortedObject,
  mutatingKeyFn: GenericMutatingFunctionType = immutableObjReplacingKey as GenericMutatingFunctionType,
): OrderbookOrdersSortedObject => {
  // console.log('reduceKeyPairToState: input: ', data);
  const res = data.reduce(
    (acc, [price, oSize]) => mutatingKeyFn(acc, getNormalizedPrice(price), oSize),
    initialState,
  );
  // console.log('reduceKeyPairToState: output: ', res);
  return res;
};

const customFormatNumberToFloat = (price: string): number => parseInt(price) / 100;

// MODIFICAR PARA QUE DEVUELVA UN ESTADO MANIPULADO Y PASARLO POR EL  main reduceKeyPairToStateWithInitialState
const ob2arr = (
  input: OrderbookOrdersSortedObject,
  initialState = [],
): WebSocketOrderbookDataArray =>
  Object.entries(input).reduce(
    (acc: WebSocketOrderbookDataArray, [currK, currV]) => [
      ...acc,
      [customFormatNumberToFloat(currK), currV],
    ],
    initialState,
  );

const mutateForGrouping = <T extends Array<any> = WebSocketOrderbookDataArray>(
  updates: T,
  groupBy: number,
  lastExactRootState: OrderbookOrdersSortedObject,
  initialReducerState = [],
): T => {
  console.log('    *** *** *** *** *** *** (starts  group)');
  const r1 = updates.reduce((acc, [price, val], drIdx) => {
    const normalizedExactPrice = getNormalizedPrice(price);
    const usePrice = getNormalizedGroupedPrice(price, groupBy);
    const oldSizeForExact =
      normalizedExactPrice in lastExactRootState ? lastExactRootState[normalizedExactPrice] : 0;

    const diff = oldSizeForExact - val;
    const oldSize = usePrice in acc ? acc[usePrice] : 0;

    const newVal = oldSize - diff;
    /*
    if (newVal == 0) {
      return acc;
    }
}
*/
    return [...acc, [usePrice, newVal]];
  }, initialReducerState);

  const r2 = r1.reduce(
    (acc, curr) => {
      // merge dups

      const _result = immutableObjReplacingKeyWithSum(acc._result, curr[0], curr[1]);
      return { ...acc, _result };
    },
    { _result: {} },
  )._result;
  //console.log({ r2 });
  const r3 = ob2arr(r2);
  console.log('    *** *** *** *** *** *** (end of group)'); //{ r1, r3 });
  return r3;
};

const mutateScopeForGrouping = (
  updates: OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>,
  groupBy: number,
  lastExactRootState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
  // initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
): OrderbookGenericScopeDataType<WebSocketOrderbookDataArray> => {
  const bids = mutateForGrouping(
    updates.bids,
    groupBy,
    lastExactRootState.bids,
    [], // ob2arr(initialState.bids),
  );

  const asks = mutateForGrouping(
    updates.asks,
    groupBy,
    lastExactRootState.asks,
    [], //ob2arr(initialState.asks),
  );
  console.log();
  console.log('    mutateScopeForGrouping: ', 'bids:', bids, 'asks:', asks);
  console.log();
  return {
    bids,
    asks,
  };
};

type OrderbookGenericScopeDataType<T> = {
  bids: T;
  asks: T;
};

const OrderbookActionUpdate = 'u';
const OrderbookActionSnapshot = 's';
type OrderbookDataUpdateActions = typeof OrderbookActionUpdate | typeof OrderbookActionSnapshot;

type WebSocketOrderbookUpdatesType = OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>;

type PendingGroupUpdateRecord = {
  kind: OrderbookDataUpdateActions;
  updates: WebSocketOrderbookUpdatesType;
  selectedLastState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>;
};

interface OrderbookStateType extends OrderbookGenericScopeDataType<OrderbookOrdersSortedObject> {
  groupBy: number;
  grouped: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>;
  pendingGroupUpdates: Array<PendingGroupUpdateRecord>;
}

type OrderbookReducerActionTypes =
  | 'CALCULATE_GROUPED'
  | 'ORDERBOOK_UPDATE'
  | 'ORDERBOOK_SNAPSHOT'
  | 'SET_GROUP_BY';

type OrderbookReducerAction = {
  type: OrderbookReducerActionTypes;
  payload: any;
};

const INITIAL_ORDERBOOK_REDUCER: OrderbookStateType = {
  groupBy: 100,
  bids: {},
  asks: {},
  grouped: { bids: {}, asks: {} },
  pendingGroupUpdates: [],
};
/*};

const reduceKeyPairToStateWithInitialState = (
  delta: WebSocketOrderbookDataArray,
  initialState: OrderbookOrdersSortedObject,
  mutatingKeyFn: GenericMutatingFunctionType = immutableObjReplacingKey as GenericMutatingFunctionType,
): OrderbookOrdersSortedObject => {
  return reduceKeyPairToState<WebSocketOrderbookDataArray>(delta, initialState, mutatingKeyFn);
  /*
  console.log();
  console.log('    [reduceKeyPairToStateWithInitialState] inputs: delta: ', delta, {
    initialState,
  });

  const stateUpdate =
    delta &&
    delta.length > 0 &&
    reduceKeyPairToState<WebSocketOrderbookDataArray>(delta, initialState, mutatingKeyFn);
  if (!stateUpdate) {
    return initialState;
  }

  const newState = {
    ...initialState,
    ...stateUpdate,
    //...initialState,
  };

  console.log('    [reduceKeyPairToStateWithInitialState] output: ', newState);
  console.log();
  return newState;
};
*/
const uniq = <T extends unknown = any>(arr: Array<T>): Array<T> => [...new Set(arr)];

const getAffectedPricesInUpdateList = (
  arr: Array<WebSocketOrderbookSizePricePair>,
): Array<OrderbookNormalizedPrice> =>
  uniq<OrderbookNormalizedPrice>(
    arr.map(([price]: WebSocketOrderbookSizePricePair) => getNormalizedPrice(price)),
  );

const getStateSelection = <
  S extends Record<any, any> = Record<any, any>,
  KN extends string = string,
>(
  keyNames: Array<KN>,
  state: S,
): OrderbookOrdersSortedObject => {
  return keyNames.reduce((acc, curr) => {
    return !state[curr] ? { ...acc } : { ...acc, [curr]: state[curr] };
  }, {});
};

const getSelectedKeysForUpdates = (
  updates: WebSocketOrderbookUpdatesType,
  state: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
): OrderbookGenericScopeDataType<OrderbookOrdersSortedObject> => {
  return {
    bids: getStateSelection<OrderbookOrdersSortedObject, OrderbookNormalizedPrice>(
      getAffectedPricesInUpdateList(updates.bids),
      state.bids,
    ),
    asks: getStateSelection<OrderbookOrdersSortedObject, OrderbookNormalizedPrice>(
      getAffectedPricesInUpdateList(updates.asks),
      state.asks,
    ),
  };
};

type GenericMutatingFunctionType = typeof immutableObjReplacingKey &
  ((a: unknown, b: unknown, c: unknown, ...d: any) => any);

const reduceUpdatesToScopedState = (
  updates: OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>,
  initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
  mutatingKeyFn: GenericMutatingFunctionType = immutableObjReplacingKey as GenericMutatingFunctionType,
): OrderbookGenericScopeDataType<OrderbookOrdersSortedObject> => ({
  bids: reduceKeyPairToState(updates.bids, initialState.bids, (a, b, c) =>
    mutatingKeyFn(a, b, c, 'g.bids'),
  ),
  asks: reduceKeyPairToState(updates.asks, initialState.asks, (a, b, c) =>
    mutatingKeyFn(a, b, c, 'g.asks'),
  ),
});

const reduceUpdatesToScopedStateForGrouped = (
  updates: OrderbookGenericScopeDataType<WebSocketOrderbookDataArray>,
  initialState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
  groupBy: number,
  lastExactRootState: OrderbookGenericScopeDataType<OrderbookOrdersSortedObject>,
) => {
  const mutatedData = mutateScopeForGrouping(
    updates,
    groupBy,
    lastExactRootState /*, initialState*/,
  );

  console.log('[G] ', {
    initialState,
    mutatedData: JSON.stringify(mutatedData),
  });

  return reduceUpdatesToScopedState(
    mutatedData,
    initialState, // { asks: {}, bids: {} },
    immutableObjReplacingKeyWithSum,
  );
};

type OrderbookReducerCalculateGroupedPartialState = Pick<
  OrderbookStateType,
  'pendingGroupUpdates' | 'bids' | 'asks' | 'grouped'
>;

const orderBookReducer = (
  state: OrderbookStateType,
  action: OrderbookReducerAction,
): OrderbookStateType => {
  switch (action.type) {
    case 'CALCULATE_GROUPED':
      // eslint-disable-next-line no-case-declarations
      const newStatePartial = state.pendingGroupUpdates.reduce(
        (
          acc: OrderbookReducerCalculateGroupedPartialState,
          { updates, selectedLastState }: PendingGroupUpdateRecord,
          uIdx,
        ) => {
          console.log('   [CALCULATE_GROUPED] reducer <' + uIdx + '> starts: ', {
            updates: updates.asks.length + ' / ' + updates.bids.length,
            selectedLastState:
              selectedLastState.bids.length > 0 || selectedLastState.asks.length > 0
                ? selectedLastState
                : '(EMPTY)',
          });

          const newScopeState = reduceUpdatesToScopedState(updates, acc);

          /*
       
          console.log('[U | ' + uIdx + '] ', {
            //  accAsks: Object.keys(acc.asks),
            // accAsksG: Object.keys(acc.grouped.asks),
            //accBidsG: Object.keys(acc.grouped.bids),
            uAsks: Object.values(updates.asks),
            uBids: Object.values(updates.bids),
            selectedLastState,
            newScopeStateKeys: Object.keys(newScopeState),
          });
        */

          const grouped = reduceUpdatesToScopedStateForGrouped(
            updates,
            acc.grouped || { ...INITIAL_ORDERBOOK_REDUCER.grouped },
            state.groupBy,
            selectedLastState,
          );
          console.log('   [CALCULATE_GROUPED] reducer finishes: ', grouped); //-> grouped', grouped); // { grouped });

          return {
            ...acc,
            ...newScopeState,
            // ...acc,
            grouped,
          };
        },
        { ...state, pendingGroupUpdates: [] },
      );

      console.log('');

      console.log(
        '  [+] -> processed! ->' + state.pendingGroupUpdates.length + ' -> deferred updates [+] ',
        //    newState,
        /*  false && {
          asks: state.pendingGroupUpdates.map(
            (x) => x.updates.asks && x.updates.asks.map((a) => a[0]),
          ),
          bids: state.pendingGroupUpdates.map(
            (x) => x.updates.bids && x.updates.bids.map((a) => a[0]),
          ),
        },*/
      );
      console.log('');
      console.log('');

      return {
        ...state,
        ...newStatePartial,
      };

    case 'ORDERBOOK_SNAPSHOT':
      console.log('ORDERBOOK_SNAPSHOT triggered: ', action.payload);
    //     break;
    // eslint-disable-next-line no-fallthrough
    case 'ORDERBOOK_UPDATE':
      //  console.log('ORDERBOOK_UPDATE triggered: ', action.payload);
      return {
        ...state,
        pendingGroupUpdates: [
          ...state.pendingGroupUpdates,
          {
            kind: OrderbookActionUpdate,
            updates: action.payload.updates,
            selectedLastState: getSelectedKeysForUpdates(action.payload.updates, state),
          },
        ],
      };
      break;

    case 'SET_GROUP_BY':
      console.log('SET_GROUP_BY');
      return {
        ...state,
        groupBy: action.payload.value,
        grouped: mutateScopeForGrouping(
          { bids: Object.entries(state.bids), asks: Object.entries(state.asks) },
          action.payload.value,
          { bids: {}, asks: {} },
        ),
      };
      break;
    default:
      throw new Error('orderBook: unknown reducer: ' + action.type);
  }
};
const _toLocaleString = (inputAsText: string) => {
  const normalizedInputAsText = parseFloat(inputAsText).toString();
  const arrSg = [...Array(Math.ceil(normalizedInputAsText.length / 3)).keys()];

  const r1 = arrSg
    .map((idx) => {
      const a = -3 * (idx + 1);
      const b = idx === 0 ? 0 : -3 * idx;
      return [...normalizedInputAsText.slice(a, b || undefined)];
    })
    .reverse();

  return r1.map((e) => e.join('')).join('.');
};

const formatNumber = (v: number, decimals = 2) => {
  return _toLocaleString(v.toFixed(decimals)); // .toLocaleString('en-US', { minimumFractionDigits: 2 });
};

const ANINMATED_TEXT_VALUE_OPTS = ({ textColor, highlightingTextColor }) => ({
  from: {
    fontSize: 16,
    color: textColor,
  },

  config: { duration: 200, mass: 1, tension: 180, friction: 120, clamp: true },
  to: [
    { color: highlightingTextColor },
    {
      color: '#666',
    },
    { color: highlightingTextColor },

    { color: textColor },
  ],
  leave: { color: '#000' },
});

const AnimatedTextValue = ({ highlightingTextColor, textColor, children, style }) => {
  // return <Text>{children}</Text>;
  const [styles, api] = useSpring(() =>
    ANINMATED_TEXT_VALUE_OPTS({ highlightingTextColor, textColor }),
  );
  React.useEffect(() => {
    return () => {
      //  console.log('clear AnimatedTextValue!', { api });
      api.stop();
    };
  }, []);

  return <animated.Text style={[style, styles]}>{children}</animated.Text>;
};

const MemoizedAnimatedTextValue = React.memo(AnimatedTextValue);

const OrderbookRow: FC<{
  price: OrderbookNormalizedPrice;
  val: number;
  total: number;
  highlightingTextColor?: string;
  textColor?: string;
}> = ({ price, val, total, textColor = '#d0f0c0', highlightingTextColor = '#fff' }) => {
  return (
    <View style={styles.orderBookRowWrap}>
      <Text style={{ color: textColor, flex: 1 }}>{getPrintPriceForNormalizedPrice(price)}</Text>
      <MemoizedAnimatedTextValue
        highlightingTextColor={highlightingTextColor}
        textColor={textColor}
        style={styles.orderBookMainText}>
        {formatNumber(val, 0)}
      </MemoizedAnimatedTextValue>
      <MemoizedAnimatedTextValue
        highlightingTextColor={highlightingTextColor}
        textColor={textColor}
        style={styles.orderBookMainText}>
        {formatNumber(total, 0)}
      </MemoizedAnimatedTextValue>
    </View>
  );
};

const MemoizedOrderbookRow = React.memo(OrderbookRow);

const getTotalForRow = (rows, idx: number, orderBy: 'asc' | 'desc') =>
  rows.reduce(
    (acc, curr, ridx) => acc + ((orderBy === 'asc' ? ridx >= idx : idx >= ridx) ? curr[1] : 0),
    0,
  );

const orderAndLimit = (
  obj: OrderbookOrdersSortedObject,
  limit = 10,
  orderBy: 'asc' | 'desc' = 'asc',
) => {
  const arr = Object.keys(obj)
    .map((key) => [Number(key), obj[key]])
    .slice(0, limit);
  return orderBy === 'desc' ? arr.reverse() : arr;
};

const OrderbookAsks = ({ normalizedData }) => {
  return (
    <MemoizedOrderbookSection
      keyPrefix={'a_'}
      backgroundColor={'#7c0a02'}
      normalizedData={normalizedData}
      totalOrderBy={'asc'}
    />
  );
};

const OrderbookBids = ({ normalizedData }) => {
  return (
    <MemoizedOrderbookSection
      keyPrefix={'b_'}
      backgroundColor={'#043927'}
      normalizedData={normalizedData}
      totalOrderBy={'desc'}
    />
  );
};

const processNormalizedData = (normalizedData, keyPrefix, totalOrderBy) =>
  normalizedData.map((e, _idx) => {
    const k = keyPrefix + '_' + e[0];
    const t = getTotalForRow(normalizedData, _idx, totalOrderBy);
    const ret = [e[0], e[1], k, t];
    return ret;
  });

const getSignatureForData = (data) => {
  return (
    data.length + '#' + (data.length > 0 ? data[0].join(',') + data[data.length - 1].join(',') : '')
  ); //JSON.stringify(data); //data.map((d) => Object.keys(d).join('.')).join(':');
};

const ORDERBOOK_SECTION_TRANSITION_OPTIONS = ({ backgroundColor, textColor }) => ({
  keys: (item) => item[2],
  from: {
    backgroundColor: textColor,
    // position: 'absolute',
    left: 400,
    position: 'absolute',
    opacity: 0.5,
  },
  enter: [
    { left: 0, position: 'relative' },
    {
      opacity: 1,
      backgroundColor,
    },
  ],
  leave: [{ backgroundColor: '#000' }, { height: 0 }, { backgroundColor: textColor }],
  delay: 25,
  expires: true,
  immediate: true,
  reset: false,
  config: { duration: 200, mass: 1, tension: 180, friction: 12 },
});

const OrderbookSection = ({
  backgroundColor,
  normalizedData,
  keyPrefix,
  totalOrderBy,
  textColor = '#c2c2c2',
}) => {
  const [dataState, setDataState] = React.useState(() =>
    processNormalizedData(normalizedData, keyPrefix, totalOrderBy),
  );

  const updateDataState = React.useCallback(() => {
    const data = processNormalizedData(normalizedData, keyPrefix, totalOrderBy);
    if (getSignatureForData(data) !== getSignatureForData(dataState)) {
      setDataState(processNormalizedData(normalizedData, keyPrefix, totalOrderBy));
    }
  }, [normalizedData, keyPrefix, dataState, setDataState, totalOrderBy]);

  const tFn = useThrottleCallback(() => updateDataState(), 1000);

  React.useEffect(() => {
    tFn();
  }, [tFn, normalizedData]);

  const transitions = useTransition(
    dataState,
    ORDERBOOK_SECTION_TRANSITION_OPTIONS({ backgroundColor, textColor }),
  );

  const TC = React.useCallback(
    (styles, item) => (
      <animated.View style={styles}>
        <MemoizedOrderbookRow price={item[0]} textColor={textColor} val={item[1]} total={item[3]} />
      </animated.View>
    ),
    [textColor],
  );

  return <View style={{ backgroundColor }}>{transitions(TC)}</View>;
};

const MemoizedOrderbookSection = React.memo(OrderbookSection);

const ORDERBOOK_MIN_GROUP_BY = 1;
const ORDERBOOK_MAX_GROUP_BY = 25000;

const AVAILABLE_FACTORS = [
  0.1, 0.25, 0.5, 1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000,
];

const getGroupByFactor = (groupBy, op: -1 | 1) => {
  if (op === 1) {
    const idx = AVAILABLE_FACTORS.indexOf(groupBy);
    if (idx >= 0 && idx - 1 <= AVAILABLE_FACTORS.length) {
      return AVAILABLE_FACTORS[idx + 1] / AVAILABLE_FACTORS[idx];
    }
    return 0;
  } else {
    if (groupBy % 2 === 0) {
      return 2;
    } else {
      return 2.5;
    }
  }
};

const GroupButton = ({ title, onPress, style }) => {
  return (
    <TouchableOpacity onPress={onPress} style={style}>
      <Text style={{ color: '#666', fontSize: 32 }}>{title}</Text>
    </TouchableOpacity>
  );
};

const calculateSpread = (high: number, low: number) => {
  if (!low || !high) {
    return 0.0;
  }

  return -1 * (high / low - 1) * 100;
};

const Spread = ({ high, low }: { high: number; low: number }) => {
  //console.log('Spread: ', { high, low });
  const [spread, setSpread] = React.useState(() => calculateSpread(high, low).toFixed(1));
  const updateSpread = React.useCallback(() => {
    const s = calculateSpread(high, low).toFixed(1);
    setSpread(s);
  }, [high, low, setSpread]);

  const fn = useDebounceCallback(updateSpread, 200);

  React.useEffect(() => {
    fn();
  }, [high, low, fn]);

  return (
    <Text style={{ padding: 10, marginHorizontal: 20, color: '#555' }}>
      {high - low} Spread: {spread + ' %'}
    </Text>
  );
};

const OrderBook: FC = () => {
  const [orderBook, dispatch] = React.useReducer(orderBookReducer, INITIAL_ORDERBOOK_REDUCER);

  const { isConnected, isInternetReachable } = NetInfo.useNetInfo();

  const [connnectionStatus, setConnectionStatus] = React.useState({
    color: 'white',
    connectedToInternet: false,
    websocket: {
      connected: false,
      connecting: false,
    },
  });

  React.useEffect(() => {
    if (isConnected) {
      if (isInternetReachable) {
        setConnectionStatus((st) => ({ ...st, color: 'green', connectedToInternet: true }));
        console.log('internet is now reachable');
      } else {
        setConnectionStatus((st) => ({ ...st, color: 'yellow', connectedToInternet: false }));
      }
    } else {
      setConnectionStatus((st) => ({ ...st, color: 'red', connectedToInternet: false }));
    }
  }, [isConnected, isInternetReachable]);

  //reduceByGroupNumber
  const onMessageReceived = React.useCallback((decoded) => {
    if (decoded?.event === 'info' || decoded?.event === 'subscribed') {
      console.log({ decoded });
    } else {
      if (!decoded?.event) {
        if (decoded?.feed === 'book_ui_1') {
          dispatch({
            type: 'ORDERBOOK_UPDATE',
            payload: { updates: decoded as Array<WebSocketOrderbookUpdateMessage<any>> },
          });
        } else if (decoded?.feed === 'book_ui_1_snapshot') {
          dispatch({
            type: 'ORDERBOOK_SNAPSHOT',
            payload: { updates: decoded as Array<WebSocketOrderbookSnapshotMessage<any>> },
          });
        } else {
          console.log('(2)', { decoded });
        }
      } else {
        console.log('(2)', { decoded });
      }
    }
  }, []);

  const onConnectionStatusChange = React.useCallback((status, client, { connect } = {}) => {
    console.log('onConnectionStatusChange:', status);
    if (status.connected === true) {
      client.send(
        JSON.stringify({
          event: 'subscribe',
          feed: 'book_ui_1',
          product_ids: ['PI_XBTUSD'],
        }),
      );
      setConnectionStatus((st) => ({
        ...st,
        websocket: { ...st.websocket, connected: true, connecting: false },
      }));
    } else if (status.connected === false) {
      setConnectionStatus((st) => ({
        ...st,
        websocket: { ...st.websocket, connected: false, connecting: false },
      }));

      setTimeout(() => {
        if (status.connectedToInternet === true) {
          console.log('should retry reconnect NOW');
          connect();
        } else {
          console.log('should retry reconnect after internet comes');
        }
      }, 5000);
    }

    setConnectionStatus((st) => ({
      ...st,
      websocket: { ...st.websocket, ...status },
    }));
  }, []);

  useWebSocket<OrderbookWSMessageType>({
    uri: WEBSOCKET_URI,
    onMessageReceived,
    onConnectionStatusChange,
  });

  const asksData = orderAndLimit(orderBook.grouped.asks, 8, 'desc');
  const bidsData = orderAndLimit(orderBook.grouped.bids, 8, 'desc');

  const _a = React.useMemo(
    () => Object.entries(orderBook.bids).slice(Object.entries(orderBook.bids).length - 1),
    [orderBook.bids],
  );

  const _b = React.useMemo(() => Object.entries(orderBook.asks)[0], [orderBook.asks]);

  //  console.log({ _a, _b, obb: orderBook.bids });
  const _onPressGroupDec = React.useCallback(
    () =>
      getGroupByFactor(orderBook.groupBy, -1) &&
      dispatch({
        type: 'SET_GROUP_BY',
        payload: {
          value: orderBook.groupBy / getGroupByFactor(orderBook.groupBy, -1),
        },
      }),
    [orderBook.groupBy],
  );

  const _onPressGroupInc = React.useCallback(
    () =>
      getGroupByFactor(orderBook.groupBy, 1) &&
      dispatch({
        type: 'SET_GROUP_BY',
        payload: { value: orderBook.groupBy * getGroupByFactor(orderBook.groupBy, 1) },
      }),
    [orderBook.groupBy],
  );

  const _cg = React.useCallback(() => {
    //  console.log('------> going to dispatch: calculateGrouped');
    dispatch({ type: 'CALCULATE_GROUPED', payload: {} });
  }, []);

  const calculateGrouped = useDebounceCallback(_cg, 125);

  React.useEffect(() => {
    calculateGrouped();
  }, [orderBook, calculateGrouped]);

  React.useEffect(() => {
    calculateGrouped();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {connnectionStatus.websocket.connected === false &&
        (connnectionStatus.connectedToInternet === true ? (
          <View style={styles.genericConnectionProblemWrapper}>
            <Text>Problems with Websocket service</Text>
          </View>
        ) : (
          <View style={styles.genericConnectionProblemWrapper}>
            <Text>Problems with inteernet</Text>
          </View>
        ))}

      <View style={styles.orderBookSubWrapper}>
        <View style={{ height: '45%', overflow: 'hidden', justifyContent: 'flex-end' }}>
          <OrderbookAsks normalizedData={asksData} />
        </View>
        <View style={styles.orderBookSummaryWrap}>
          {typeof _a[0] !== 'undefined' && typeof _b[0] !== 'undefined' && (
            <Spread high={parseFloat(_a[0]) / 100} low={parseFloat(_b[0]) / 100} />
          )}
          <Text style={{ flex: 1, flexShrink: 0 }}>Group: {orderBook.groupBy}</Text>

          <View style={{ padding: 4, flex: 1, flexDirection: 'row' }}>
            <GroupButton title={'-'} style={{ flex: 1 }} onPress={_onPressGroupDec} />
            <GroupButton title={'+'} style={{ flex: 1 }} onPress={_onPressGroupInc} />
          </View>
        </View>
        <View style={{ height: '45%', overflow: 'hidden' }}>
          <OrderbookBids normalizedData={bidsData} />
        </View>
      </View>
    </View>
  );
};

const App: FC = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <SafeAreaView style={[backgroundStyle, { flex: 1 }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1 }}
        style={[backgroundStyle, { flex: 1 }]}>
        <View style={{ flex: 1 }}>
          <OrderBook />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  genericConnectionProblemWrapper: {
    backgroundColor: 'red',
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 10,
  },
  orderBookSummaryWrap: {
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: '10%',
    padding: '2.5%',
  },
  orderBookSubWrapper: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    alignContent: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  orderBookMainText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Monospace' : 'monospace',
  },
  orderBookRowWrap: { padding: 10, flexDirection: 'row' },
});

export default App;
