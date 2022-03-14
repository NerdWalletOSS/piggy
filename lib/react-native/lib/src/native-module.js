import _ from 'lodash';
import { NativeModules } from 'react-native';

export const isNativeModuleAvailable = !!NativeModules.PiggyModule;

export const NativeModule = isNativeModuleAvailable
  ? NativeModules.PiggyModule
  : {
      create: _.noop,
      getConfiguration: () => Promise.resolve({ enabled: false }),
      getCookies: () => Promise.resolve({}),
      onStarted: _.noop,
      record: _.noop,
      report: _.noop,
      setConfiguration: () => Promise.resolve(true),
      start: _.noop,
      stop: _.noop,
    };
