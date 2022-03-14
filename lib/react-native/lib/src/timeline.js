import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { NativeModule } from './native-module';
import { IS_AVAILABLE, TIMELINE_PRIORITIES, FEATURE } from './constants';
import { isObjectNotFunction, clean, deepClean } from './util';

const ALL_STOPWATCHES = {};

let enabled = false;

const resolveContext = async (context) => {
  if (context === undefined || context === null) {
    return {};
  }
  if (isObjectNotFunction(context)) {
    return deepClean(context);
  }
  return { value: clean(context) };
};

class Work {
  constructor(stopwatch, priority, workName, workId) {
    this.stopwatch = stopwatch;
    this.workName = workName;
    this.workId = workId;
    this.startTime = Date.now();
  }

  async stop(context) {
    this.endTime = Date.now();
    if (enabled) {
      const resolvedContext = await resolveContext(context);
      NativeModule.record(
        this.stopwatch.name,
        this.workName,
        this.workId,
        this.startTime,
        this.endTime,
        this.stopwatch.priority,
        resolvedContext
      );
    }
  }
}

class Stopwatch {
  constructor(name, priority, options) {
    this.name = name;
    this.priority = priority || TIMELINE_PRIORITIES.DEFAULT;
    if (enabled) {
      NativeModule.create(name, options || {});
    }
  }

  start(workName) {
    return new Work(this, this.priority, workName, uuid());
  }

  checkpoint(name) {
    new Work(this, this.priority, name, uuid()).stop();
  }

  async record(workName, startTime, endTime, context) {
    if (enabled) {
      const resolvedContext = await resolveContext(context);
      NativeModule.record(
        this.name,
        workName,
        uuid(),
        startTime,
        endTime,
        this.priority,
        resolvedContext
      );
    }
  }
}

const setConfiguration = (config) => {
  enabled = config.features[FEATURE.TIMELINE];
};

export default {
  stopwatch: (name, priority, options) => {
    if (ALL_STOPWATCHES[name]) {
      return ALL_STOPWATCHES[name];
    }
    ALL_STOPWATCHES[name] = new Stopwatch(name, priority, options);
    return ALL_STOPWATCHES[name];
  },
  record: IS_AVAILABLE ? NativeModule.record : _.noop,
  report: IS_AVAILABLE ? NativeModule.report : _.noop,
  setConfiguration,
};
