import { isNativeModuleAvailable } from './native-module';

export const IS_TESTING = process.env.JEST_WORKER_ID !== undefined;

export const IS_AVAILABLE =
  IS_TESTING ||
  (!process.env.PIGGY_DISABLED &&
    process.env.RELEASE_STAGE !== 'production' &&
    process.env.NODE_ENV !== 'test' &&
    isNativeModuleAvailable);

export const EVENT_TYPE = {
  CONSOLE: 'console',
  HTTP_REQUEST: 'http/request',
  HTTP_RESPONSE: 'http/response',
  REDUX_ACTION: 'redux/action',
  VIEW_RENDER: 'view/render',
};

export const EVENT_LEVEL = {
  INFO: 'info',
  WARN: 'warn',
  DEBUG: 'debug',
  ERROR: 'error',
};

export const WEBSOCKET_MESSAGE_TYPE = {
  UPDATE_STATE_SUBSCRIPTIONS: '/stateSubscriptions/update',
  SET_STATE_SUBSCRIPTION_PATHS: '/stateSubscriptions/setPaths',
  SEND_EVENT_LOG: '/eventLog/send',
  UPDATE_FSM: '/fsm/update',
  UPDATE_REACT_PROFILER: '/reactProfiler/update',
};

export const COLOR_HINT = {
  WHITE: 'white',
  BLUE: 'blue',
  GREEN: 'green',
  YELLOW: 'yellow',
  CYAN: 'cyan',
  MAGENTA: 'magenta',
  RED: 'red',
};

export const FEATURE = {
  HTTP: 'http',
  SET_TIMEOUT: 'settimeout',
  EVENT_LOG: 'eventlog',
  CONSOLE: 'logger',
  TIMELINE: 'timeline',
};
