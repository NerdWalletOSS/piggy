const reactNativeRuntime = require('react-native');

reactNativeRuntime.NativeModules.Piggy = {
  start: jest.fn(),
  stop: jest.fn(),
  checkpoint: jest.fn(),
  record: jest.fn(),
  report: jest.fn(),
  setConfiguration: jest.fn(),
  getConfiguration: jest.fn(),
  onStarted: jest.fn(),
  logEvent: jest.fn(),
  getCookies: jest.fn(),
};
