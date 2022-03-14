const logger = require('./logger').default;
const { isNativeModuleAvailable, NativeModule } = require('./native-module');
const webSocket = require('./websocket').default;
const timeline = require('./timeline').default;
const eventlog = require('./eventlog').default;
const redux = require('./redux').default;
const http = require('./http').default;
const settimeout = require('./settimeout').default;
const constants = require('./constants');

const { FEATURE, IS_AVAILABLE } = constants;

const FEATURE_DEFAULTS = {
  [FEATURE.HTTP]: isNativeModuleAvailable,
  [FEATURE.SET_TIMEOUT]: false,
  [FEATURE.EVENT_LOG]: isNativeModuleAvailable,
  [FEATURE.CONSOLE]: isNativeModuleAvailable,
  [FEATURE.TIMELINE]: isNativeModuleAvailable,
};

let enabledFeatures = { ...FEATURE_DEFAULTS };

const lazy = {
  config: null,
};

const getConfiguration = async () => {
  /* this is pretty gross, but lots of events get generated while the app is
  running, and we don't want to incur a bridge round trip each time.
  JSI may help with this in the future. */
  if (!lazy.config) {
    lazy.config = await NativeModule.getConfiguration();
  }
  return lazy.config;
};

const updateModuleConfigurations = () => {
  const configWithFeatures = {
    ...(lazy.config || {}),
    features: { ...enabledFeatures },
  };
  [webSocket, http, settimeout, eventlog, timeline].forEach((module) =>
    module.setConfiguration(configWithFeatures)
  );
};

const setConfiguration = async (...args) => {
  await NativeModule.setConfiguration(...args);
  lazy.config = await NativeModule.getConfiguration();
  updateModuleConfigurations();
};

const isEnabled = async () => {
  if (IS_AVAILABLE) {
    const config = await getConfiguration();
    return config.enabled;
  }
  return false;
};

const start = async (features) => {
  if (IS_AVAILABLE) {
    enabledFeatures = { ...FEATURE_DEFAULTS, ...(features || {}) };
    logger.setEnabled(enabledFeatures[FEATURE.CONSOLE]);
    /* update immediately with feature flags, otherwise data may get lost
    between now and the time the configuration comes back */
    updateModuleConfigurations();
    NativeModule.onStarted();
    if (await isEnabled()) {
      /* update again once the configuration has been pulled down */
      updateModuleConfigurations();
    }
    console
      .logger('Piggy')
      .debug('started. feature configuration:', enabledFeatures);
  } else {
    enabledFeatures = {};
    updateModuleConfigurations();
  }
};

export default {
  isEnabled,
  configuration: {
    get: NativeModule.getConfiguration,
    set: setConfiguration,
  },
  start,
  constants: { ...constants },
  logger: { ...logger },
  timeline: { ...timeline },
  eventLog: { ...eventlog },
  webSocket: { ...webSocket },
  http: { ...http },
  redux: { ...redux },
};
