import _ from 'lodash';
import { EVENT_TYPE, IS_TESTING } from './constants';

const GLOBAL_TAG = 'global';
const INSTANCES = {};

/* well-known debug levels, and mappings from level to function that should
be invoked. in most cases these pass through to the original console
implementation, but errors will go through another level of indirection
so they can be logged to the backend as well! */
const LEVELS = {
  LOG: 'log',
  INFO: 'log',
  WARN: 'warn',
  DEBUG: 'debug',
  ERROR: 'error',
};

/* users can register custom error handlers that get invoked on
a console.error() or console.logger().error() */
const customErrorHandlers = new Set();

/* we know certain keys have values so large they blow up the bridge. this
is a list of those keys. */
const KEY_BLACKLIST = new Set(['_reactInternalFiber']);

/* used to avoid cyclic dependencies */
const lazy = {};

/* disabled until until someone says otherwise */
let isPiggyConsoleEnabled = false;

/* enabled by default, but can be disabled manually by the caller, e.g. to
suppress output to the system log in release builds */
let isSystemConsoleEnabled = true;

/* stub this out right away, even if we're not enabled... */
console.logger = () => console;

/* the low-level console instance we'll delegate through to after doing any
piggy-specific processing. */
const systemConsole = { ...console };

/* our special "error" function that writes to the original console,
but also custom error handlers supplied by the host application. the host
app can use this to do things like log console errors to an error tracking
service. */
const customError = (tag, ...args) => {
  if (isSystemConsoleEnabled) {
    systemConsole.error(tag, ...args);
  }
  customErrorHandlers.forEach((fn) => fn(tag, ...args));
};

const processLogEntry = (level, tag, ...args) => {
  /* send to the piggy if the feature is enabled */
  if (isPiggyConsoleEnabled) {
    if (!lazy.eventLog) {
      lazy.eventLog = require('./eventlog').default;
      lazy.eventLog.setRedactorForEventType(EVENT_TYPE.CONSOLE, ({ key }) =>
        KEY_BLACKLIST.has(key)
      );
    }
    if (lazy.eventLog) {
      lazy.eventLog.send({
        type: EVENT_TYPE.CONSOLE,
        level,
        tag,
        data: {
          arguments: [...args],
        },
      });
    }
  }

  const logWithTag = [`[${tag}]`, ...args];
  /* error handling is a special snowflake; we always call through to it if
  the level matches to make sure registered callbacks run. internally it
  will ensure not to call through to `systemConsole` if disabled */
  if (level === LEVELS.ERROR) {
    customError(...logWithTag);
  } else if (isSystemConsoleEnabled) {
    /* send to the active systemConsole if it's enabled */
    switch (level) {
      case LEVELS.LOG:
        systemConsole.log(...logWithTag);
        break;
      case LEVELS.INFO:
        systemConsole.info(...logWithTag);
        break;
      case LEVELS.WARN:
        systemConsole.warn(...logWithTag);
        break;
      case LEVELS.DEBUG:
        systemConsole.debug(...logWithTag);
        break;
      default:
        break;
    }
  }
};

/* we monkey-patch `console` to prepend a [GLOBAL_TAG] tag to all calls */
let patchedConsole;
let createLogger;

if (IS_TESTING) {
  /* although we do a pretty small amount of processing, it can add up really
  quickly in environments where thousands of tests are running as quickly as
  possible. let's be sensitive to this, and use the original console if we
  know we're running in a testing environment, except for `error()`, which
  should always call through to the custom error handler */
  patchedConsole = _.merge({}, systemConsole, {
    error: (...args) => processLogEntry(LEVELS.ERROR, GLOBAL_TAG, ...args),
  });

  createLogger = (tag) =>
    _.merge({}, systemConsole, {
      error: (...args) => processLogEntry(LEVELS.ERROR, tag, ...args),
    });
} else {
  patchedConsole = _.merge({}, systemConsole, {
    log: (...args) => processLogEntry(LEVELS.LOG, GLOBAL_TAG, ...args),
    info: (...args) => processLogEntry(LEVELS.INFO, GLOBAL_TAG, ...args),
    debug: (...args) => processLogEntry(LEVELS.DEBUG, GLOBAL_TAG, ...args),
    warn: (...args) => processLogEntry(LEVELS.WARN, GLOBAL_TAG, ...args),
    error: (...args) => processLogEntry(LEVELS.ERROR, GLOBAL_TAG, ...args),
  });

  /* this creates a new `logger` instance for the specified `tag` */
  createLogger = (tag) => ({
    log: (...args) => processLogEntry(LEVELS.LOG, tag, ...args),
    info: (...args) => processLogEntry(LEVELS.INFO, tag, ...args),
    debug: (...args) => processLogEntry(LEVELS.DEBUG, tag, ...args),
    warn: (...args) => processLogEntry(LEVELS.WARN, tag, ...args),
    error: (...args) => processLogEntry(LEVELS.ERROR, tag, ...args),
    /* get() allows the caller to create a "sub" logger, whose tag value
    is "[tag]/[subtag]" */
    logger: (subTag) => createLogger(`${tag}/${subTag}`),
  });
}

const setEnabled = (enabled) => {
  isPiggyConsoleEnabled = enabled;
};

const setSystemConsoleEnabled = (enabled) => {
  isSystemConsoleEnabled = enabled;
};

/* replace the global `console` with our `patchedConsole`, which can multiplex
output to piggy and the original console (defined as systemConsole earlier
in this source unit) */
console = patchedConsole; /* eslint-disable-line */

/* see if we already have a `logger` instance for the specified `tag`. if so,
return it immediately . otherwise, create it, cache it, then return it */
console.logger = (tag) => {
  if (INSTANCES[tag]) {
    return INSTANCES[tag];
  }
  INSTANCES[tag] = createLogger(tag);
  return INSTANCES[tag];
};

export default {
  addCustomErrorHandler: (fn) => customErrorHandlers.add(fn),
  removeCustomErrorHandler: (fn) => customErrorHandlers.delete(fn),
  createLogger,
  setEnabled,
  setSystemConsoleEnabled,
};
