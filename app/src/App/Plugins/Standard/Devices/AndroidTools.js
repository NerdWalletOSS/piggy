import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { css } from 'aphrodite/no-important';
import { faPlug } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Checkbox from '@widgets/Checkbox/Checkbox';
import toast from '@widgets/Toast/Toast';
import { BackendContext } from '@app/BackendContext';
import styles from './DevicesStyles';
import {
  DEVICE_SETTINGS_KEYS,
  getDevicesSetting,
  setDevicesSetting,
} from './DevicesSettings';

const { adbkit } = global.ipc;

const PNG_FILE_FILTER = [{ name: 'png image file', extensions: ['png'] }];
const TEXT_FILE_FILTER = [{ name: 'text document', extensions: ['txt'] }];

const saveToFile = async ({ stream, title, filters, defaultPath }) => {
  const options = {
    title,
    filters,
    defaultPath,
  };
  const result = await global.ipc.dialog.save(options);
  if (result && !result.canceled && result.filePath) {
    global.ipc.io.streamToFile(stream, result.filePath);
    return result.filePath;
  }
  return null;
};

export default class AndroidTools extends PureComponent {
  constructor(props) {
    super(props);
    this.adb = adbkit.createClient();
    this.state = {
      deviceId: null,
      autoConnect: getDevicesSetting(
        DEVICE_SETTINGS_KEYS.AUTO_CONNECT_ANDROID_DEVICES
      ),
    };
  }

  componentDidMount = () => {
    this.updateConnectedDevices();
  };

  componentDidUpdate = () => {
    this.updateConnectedDevices();
  };

  handleDeviceClick = (deviceId) => {
    this.setState({
      deviceId,
    });
  };

  handleDisconnect = async () => {
    const { deviceId } = this.state;
    if (deviceId) {
      try {
        await global.ipc.android.reverseRemoveAll(deviceId);
        toast.success(`disconnected device '${deviceId}'`);
      } catch (e) {
        console.log(e);
        toast.error(`unable to disconnect ports for device '${deviceId}'`);
      }
    } else {
      toast.error('no device selected');
    }
  };

  handleConnect = async () => {
    const { forwardedPorts } = this.props;
    const { deviceId } = this.state;
    const device = this.adb.getDevice(deviceId);
    if (device) {
      try {
        await Promise.all(
          forwardedPorts.map(async (port) => {
            await device.reverse(`tcp:${port}`, `tcp:${port}`);
          })
        );
        toast.success(`connected device '${deviceId}'`);
      } catch (e) {
        console.log(e);
        toast.error(
          `unable to connect required ports for device '${deviceId}'`
        );
      }
    } else {
      toast.error('no device selected');
    }
  };

  handleScreenshot = async () => {
    const { deviceId } = this.state;
    const device = this.adb.getDevice(deviceId);
    if (device) {
      let stream;
      try {
        stream = await device.screencap();
        const finalFn = await saveToFile({
          stream,
          title: 'save screenshot',
          filters: PNG_FILE_FILTER,
          defaultPath: `${global.ipc.env.getPath(
            'home'
          )}/android-screenshot-${deviceId}-${Date.now()}.png`,
        });
        if (finalFn) {
          toast.success(`saved screenshot to '${finalFn}'`);
          return true;
        }
        return false;
      } catch (e) {
        console.log(e);
      }
      toast.error(`unable to capture screen on device '${deviceId}'`);
    } else {
      toast.error('no device selected');
    }
    return false;
  };

  handlePullLogs = async () => {
    const { deviceId } = this.state;
    const device = this.adb.getDevice(deviceId);
    if (device) {
      try {
        const logcat = await device.openLogcat();
        if (logcat) {
          const stream = await global.ipc.android.readLogcat(deviceId);
          if (stream) {
            const finalFn = await saveToFile({
              stream,
              title: 'save logcat dump',
              filters: TEXT_FILE_FILTER,
              defaultPath: `${global.ipc.env.getPath(
                'home'
              )}/android-logcat-${deviceId}-${Date.now()}.txt`,
            });
            if (finalFn) {
              toast.success(`saved logcat dump to '${finalFn}'`);
              return true;
            }
            return false;
          }
        }
      } catch (e) {
        console.log(e);
      }
      toast.error(`unable to open logcat on device '${deviceId}'`);
    } else {
      toast.error('no device selected');
    }
    return false;
  };

  handleRestartAdb = async () => {
    const success = await global.ipc.android.restartAdb();
    if (success) {
      toast.success('successfully restarted adb!');
    } else {
      toast.error('failed to restart adb.');
    }
  };

  updateConnectedDevices = () => {
    const { devices } = this.context;
    let { deviceId: currentDeviceId } = this.state;

    /* current/selected device */
    if (
      currentDeviceId &&
      !_.find(devices, (item) => item.id === currentDeviceId)
    ) {
      currentDeviceId = null;
    }

    currentDeviceId = currentDeviceId || (devices.length && devices[0].id);

    this.setState({
      deviceId: currentDeviceId,
    });
  };

  renderDeviceRows = (devices, reverses, deviceId, buttonsEnabled) => {
    let rows;
    if (devices.length) {
      rows = devices.map((device) => {
        const { id } = device;
        const selected = id === deviceId;
        const reversesForDevice = reverses[id] || [];
        return (
          <div
            onClick={
              buttonsEnabled ? this.handleDeviceClick.bind(this, id) : undefined
            }
            className={css(
              styles.devicesBlockListRow,
              styles.devicesSelectableListRow,
              selected ? styles.devicesBlockListRowSelected : undefined
            )}
          >
            <FontAwesomeIcon
              className={css(
                styles.devicesRowIcon,
                reversesForDevice.length <= 0 && styles.devicesRowIconDisabled
              )}
              icon={faPlug}
              fixedWidth
            />
            {device.id}
          </div>
        );
      });
    } else {
      rows = [
        <div className={css(styles.devicesBlockListRow)}>
          no android devices available.
        </div>,
      ];
    }
    return rows;
  };

  handleAutoConnectChange = (value) => {
    setDevicesSetting(DEVICE_SETTINGS_KEYS.AUTO_CONNECT_ANDROID_DEVICES, value);
    this.setState({ autoConnect: value });
  };

  render = () => {
    const { devices, reverses } = this.context;
    const { forwardedPorts } = this.props;
    const { deviceId, autoConnect } = this.state;

    const buttonsEnabled = !!deviceId;
    const buttonClass = css([
      styles.devicesBlockFooterButton,
      !buttonsEnabled && styles.devicesBlockDisabledButton,
    ]);

    const connectedDevices = Object.keys(reverses).reduce((acc, key) => {
      if (reverses[key].length === forwardedPorts.length) {
        acc += 1;
      }
      return acc;
    }, 0);

    const reversesForSelectedDevice = reverses[deviceId] || [];
    const isSelectedDeviceConnected = reversesForSelectedDevice.length > 0;

    const rows = this.renderDeviceRows(
      devices,
      reverses,
      deviceId,
      buttonsEnabled
    );

    const portChips = reversesForSelectedDevice.map((port) => (
      <div className={css(styles.devicesRowChip)}>{`${
        port.remote.split(':')[1]
      }`}</div>
    ));

    return (
      <div className={css(styles.devicesBlock)}>
        <div className={css(styles.devicesBlockHeader)}>android devices </div>
        <div style={{ display: 'flex' }}>
          <Checkbox
            style={{ marginLeft: 4, marginTop: 4 }}
            label="automatically connect attached devices"
            value={autoConnect}
            onChange={this.handleAutoConnectChange}
          />
        </div>
        <div className={css(styles.devicesBlockList)}>
          {rows}
          {connectedDevices > 0 ? (
            <div
              className={css(styles.devicesBlockListRow)}
              style={{ marginTop: 4 }}
            >
              reversed ports:
              {portChips}
            </div>
          ) : null}
        </div>
        <div className={css(styles.devicesBlockFooter)}>
          <div className={buttonClass} onClick={this.handleConnect}>
            {isSelectedDeviceConnected ? 'reconnect' : 'connect'}
          </div>
          {isSelectedDeviceConnected && (
            <div className={buttonClass} onClick={this.handleDisconnect}>
              disconnect
            </div>
          )}
          <div className={buttonClass} onClick={this.handleScreenshot}>
            screenshot
          </div>
          <div className={buttonClass} onClick={this.handlePullLogs}>
            save logcat
          </div>
          <div
            className={css(styles.devicesBlockFooterButton)}
            onClick={this.handleRestartAdb}
          >
            restart adb
          </div>
        </div>
      </div>
    );
  };
}

AndroidTools.propTypes = {
  forwardedPorts: PropTypes.arrayOf(PropTypes.string).isRequired,
};

AndroidTools.contextType = BackendContext;
