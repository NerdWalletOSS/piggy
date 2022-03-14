import settings from '@app/Settings';

export const DEVICE_SETTINGS_KEYS = {
  AUTO_CONNECT_ANDROID_DEVICES: 'autoConnectAndroidDevices',
  FORWARDED_PORTS: 'forwardedPorts',
};

export const DEVICE_SETTINGS_DEFAULTS = {
  [DEVICE_SETTINGS_KEYS.AUTO_CONNECT_ANDROID_DEVICES]: true,
  [DEVICE_SETTINGS_KEYS.FORWARDED_PORTS]: [8081, 8347, 8888, 17321],
};

export const getDevicesSetting = (key) =>
  settings.get('devices').get(key, DEVICE_SETTINGS_DEFAULTS[key]);

export const setDevicesSetting = (key, value) =>
  settings.get('devices').set(key, value);
