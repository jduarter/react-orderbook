/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                               *
 *                    | react-native-orderbook |                 *
 *                                                               *
 *  License |  MIT General Public License                        *
 *  Author  |  Jorge Duarte Rodríguez <info@malagadev.com>       *
 *                                                               *
 *                            (c) 2021                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
import NetInfo from '@react-native-community/netinfo';

const DEFAULT_OPTIONS = {
  reachabilityUrl: 'https://clients3.google.com/generate_204',
  reachabilityTest: async (response: { status: number }) =>
    response.status === 204,
  reachabilityLongTimeout: 60 * 1000, // 60s
  reachabilityShortTimeout: 5 * 1000, // 5s
  reachabilityRequestTimeout: 15 * 1000, // 15s
};

NetInfo.configure(DEFAULT_OPTIONS);

type SubscribeHandler<T, S = any> = (state: S) => void;
type UnsubscribeHandler<T> = () => void;
type SubscribeFunction<T, S = any> = (
  handler: SubscribeHandler<T, S>,
) => UnsubscribeHandler<T>;

export const subscribe: SubscribeFunction<typeof NetInfo> = (handler) => {
  const unsubscribe = NetInfo.addEventListener(handler);
  return unsubscribe;
};

export const useNetInfo: typeof NetInfo['useNetInfo'] = (
  options = DEFAULT_OPTIONS,
) => NetInfo.useNetInfo(options);
