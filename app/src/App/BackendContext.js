import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  getDevicesSetting,
  DEVICE_SETTINGS_KEYS,
} from './Plugins/Standard/Devices/DevicesSettings';

const MESSAGE = {
  CLIENT_CONNECTED: '/client/connected',
  CLIENT_DISCONNECTED: '/client/disconnected',
};

const { adbkit } = global.ipc;

export const BackendContext = React.createContext();

export class BackendContextProvider extends PureComponent {
  adb = adbkit.createClient();

  refreshInterval = null;

  constructor(props) {
    super(props);
    this.state = {
      clients: [],
      devices: [],
      reverses: {},
    };
    this.handleClientConnected = this.handleClientConnected.bind(this);
    this.handleClientDisconnected = this.handleClientDisconnected.bind(this);
  }

  componentDidMount() {
    global.ipc.events.on(MESSAGE.CLIENT_CONNECTED, this.handleClientConnected);
    global.ipc.events.on(
      MESSAGE.CLIENT_DISCONNECTED,
      this.handleClientDisconnected
    );

    this.refreshDeviceList();
    if (!this.refreshInterval) {
      this.refreshInterval = setInterval(() => {
        this.refreshDeviceList();
      }, 1000);
    }

    this.restartIosForwarder();

    global.ipc.android.startAdb();
  }

  componentWillUnmount() {
    global.ipc.events.off(MESSAGE.CLIENT_CONNECTED, this.handleClientConnected);
    global.ipc.events.off(
      MESSAGE.CLIENT_DISCONNECTED,
      this.handleClientDisconnected
    );

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  handleClientConnected(event, client) {
    const { clients } = this.state;
    this.setState({
      clients: clients.concat([client]),
    });
  }

  handleClientDisconnected(event, client) {
    const { clients } = this.state;
    this.setState({
      clients: _.reject(clients, { id: client.id }),
    });
  }

  restartIosForwarder = () => {
    if (!global.ipc.forwarder.isAvailable()) {
      return;
    }
    if (!global.ipc.forwarder.isRunning()) {
      const forwardedPorts = getDevicesSetting(
        DEVICE_SETTINGS_KEYS.FORWARDED_PORTS
      );
      if (!forwardedPorts.length) {
        return;
      }
      global.ipc.forwarder.start(forwardedPorts);
    }
  };

  autoConnectAndroidDevicesIfEnabled = () => {
    if (getDevicesSetting(DEVICE_SETTINGS_KEYS.AUTO_CONNECT_ANDROID_DEVICES)) {
      const { devices } = this.state;
      if (!devices.length) {
        return;
      }
      const forwardedPorts = getDevicesSetting(
        DEVICE_SETTINGS_KEYS.FORWARDED_PORTS
      );
      if (!forwardedPorts.length) {
        return;
      }
      devices.forEach(async ({ id }) => {
        const device = this.adb.getDevice(id);
        if (device && device.reverse) {
          await Promise.all(
            forwardedPorts.map(async (port) => {
              console.log(
                '[BackendContext]',
                `forwarding ${port} for android device ${id}`
              );
              await device.reverse(`tcp:${port}`, `tcp:${port}`);
            })
          );
        }
      });
    }
  };

  async refreshDeviceList() {
    const devices = (await this.adb.listDevices()) || [];
    const reverses = {};
    await Promise.all(
      devices.map(async (deviceDescriptor) => {
        const device = this.adb.getDevice(deviceDescriptor.id);
        if (device) {
          reverses[deviceDescriptor.id] = await device.listReverses(
            deviceDescriptor.id
          );
        }
      })
    );

    const deviceListChanged = !_.isEqual(devices, this.state.devices);
    const reverseListChanged = !_.isEqual(reverses, this.state.reverses);
    if (deviceListChanged || reverseListChanged) {
      this.setState({ devices, reverses });
      if (deviceListChanged) {
        this.autoConnectAndroidDevicesIfEnabled();
      }
    }
  }

  render() {
    const { children } = this.props;
    return (
      <BackendContext.Provider value={{ ...this.state }}>
        {children}
      </BackendContext.Provider>
    );
  }
}

BackendContextProvider.propTypes = {
  children: PropTypes.object.isRequired,
};
