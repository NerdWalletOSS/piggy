import {
  getDevicesSetting,
  setDevicesSetting,
  DEVICE_SETTINGS_KEYS,
} from '@plugins/Standard/Devices/DevicesSettings';

const pad = (str) => str.padStart(8, '0');

const parseVersion = (version) => {
  let parts = (version || '').split('.');
  if (parts.length !== 3) {
    parts = ['0', '0', '0'];
  }
  return [pad(parts[0]), pad(parts[1]), pad(parts[2])].join('-');
};

const versionGreaterThan = (a, b) => parseVersion(a) > parseVersion(b);

const versionLessThan = (a, b) => parseVersion(a) < parseVersion(b);

const runMigrations = (currentVersion, lastVersion) => {
  if (versionGreaterThan(currentVersion, lastVersion)) {
    if (versionLessThan(lastVersion, '0.31.0')) {
      /* the upgrade to 0.31.0 added support for the ReactNative profiler, which requires
      a port 8097 to be forwarded by default. go ahead and add it to the set... */
      const forwardedPorts =
        getDevicesSetting(DEVICE_SETTINGS_KEYS.FORWARDED_PORTS) || [];
      if (forwardedPorts.indexOf(8097) === -1) {
        setDevicesSetting(
          DEVICE_SETTINGS_KEYS.FORWARDED_PORTS,
          [...forwardedPorts, 8097].sort()
        );
      }
      console.log('test');
    }
  }
};

export default runMigrations;
