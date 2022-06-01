import _ from 'lodash';

const instances = {};

class Settings {
  constructor(filename) {
    this.settings = {};
    this.defaults = {};
    this.readFromFile(filename);
  }

  readFromFile = (filename) => {
    if (filename) {
      this.filename = filename;
      try {
        this.settings = JSON.parse(
          global.ipc.fs.readFileSync(this.filename).toString()
        );
      } catch (e) {
        this.settings = {};
        console.error('settings load failed', e);
      }
    }
  };

  flushToDisk = (filename) => {
    try {
      const { dir } = global.ipc.path.parse(filename || this.filename);
      if (!global.ipc.fs.existsSync(dir)) {
        global.ipc.fs.mkdirSync(dir, { recusive: true });
      }
      global.ipc.fs.writeFileSync(filename, JSON.stringify(this.settings));
    } catch (e) {
      console.error('settings write failed');
    }
  };

  writeToFile = _.debounce(this.flushToDisk, 1000);

  get = (key, defaultValue) => {
    if (!_.isUndefined(_.get(this.settings, key))) {
      return _.get(this.settings, key);
    }
    if (!_.isUndefined(_.get(this.defaults, key))) {
      return _.get(this.defaults, key);
    }
    return defaultValue;
  };

  set = (key, value) => {
    const existing = this.get(key);
    if (existing !== value) {
      _.set(this.settings, key, value);
      this.writeToFile(this.filename);
    }
  };

  setDefaults = (defaults) => {
    this.defaults = defaults;
  };

  remove = (key) => {
    _.unset(this.settings, key);
    this.writeToFile(this.filename);
  };

  flush = () => {
    this.flushToDisk(this.filename);
  };
}

instances.global = new Settings(
  `${global.ipc.env.getPath('home')}/.config/piggy/settings.json`
);

export default {
  get: (key) => {
    if (!instances[key]) {
      instances[key] = new Settings(
        `${global.ipc.env.getPath('home')}/.config/piggy/${key}_settings.json`
      );
    }
    return instances[key];
  },
  import: (key, fn) => {
    const result = this.get(key);
    result.readFromFile(fn);
    return result;
  },
};
