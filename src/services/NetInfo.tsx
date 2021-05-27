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

type SubscribeHandler<S = any> = (state: S) => void;
type UnsubscribeHandler = () => void;
type SubscribeFunction<S = any> = (
    handler: SubscribeHandler<S>,
) => UnsubscribeHandler;

export const subscribe: SubscribeFunction<typeof NetInfo> = (handler: any) => {
    const unsubscribe = NetInfo.addEventListener(handler);
    return unsubscribe;
};

export const useNetInfo: typeof NetInfo['useNetInfo'] = (
    options = DEFAULT_OPTIONS,
) => NetInfo.useNetInfo(options);
