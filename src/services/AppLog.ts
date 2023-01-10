// import { addPlugin as flipperPlugin } from 'react-native-flipper';

import * as React from 'react';

import {
  initMainScopeLogger,
  destroyMainScopeLogger,
  FlipperConsumer,
  ConsoleConsumer,
  loggerForScope,
} from 'interlogger';

import type { Consumer, ConfigType, LoggerType } from 'interlogger';

const LOG_CONSUMERS: Consumer[] = [
  ConsoleConsumer,
  /* FlipperConsumer({
    flipperPlugin,
  }),*/
];

const LOG_RULES: ConfigType['rules'] = ({ doesNotMatch }) => ({
  any: [
    {
      all: [
        // doesNotMatch('$.consumer.name', 'Flipper'),
        doesNotMatch('$.scope', 'useGeneratorQueue'),
      ],
    },
  ],
});

export const initLoggers = (): void => {
  initMainScopeLogger(
    {
      consumers: LOG_CONSUMERS,
      rules: LOG_RULES,
    },
    true,
  );
};

export const destroyLoggers = () => {
  return destroyMainScopeLogger();
};

export const useLogScope = (scopeName: string): LoggerType => {
  const logger = React.useMemo(() => loggerForScope(scopeName), [scopeName]);
  return React.useMemo(() => logger, [logger]);
};
