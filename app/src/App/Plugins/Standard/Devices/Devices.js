import _ from 'lodash';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { css } from 'aphrodite/no-important';
import PluginLayout from '@widgets/Plugin/PluginLayout';
import { Toolbar, ToolbarIcon } from '@widgets/Toolbar';
import CrudList from '@widgets/CrudList/CrudList';
import { sortIntArray } from '@lib/utils';
import { faUsb } from '@fortawesome/free-brands-svg-icons';
import styles from './DevicesStyles';
import ClientList from './ClientList';
import AndroidTools from './AndroidTools';
import Forwarder from './Forwarder';
import Blocklist from './Blocklist';
import {
  DEVICE_SETTINGS_KEYS,
  getDevicesSetting,
  setDevicesSetting,
} from './DevicesSettings';

export default class Devices extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showForwardedPortsModal: false,
      forwardedPorts: getDevicesSetting(DEVICE_SETTINGS_KEYS.FORWARDED_PORTS),
    };
  }

  handleForwardedPortsClick = () => {
    this.setState({ showForwardedPortsModal: true });
  };

  handleForwardedPortsModalClose = () => {
    this.setState({ showForwardedPortsModal: false });
  };

  renderForwardedPortsModal = () => {
    const { forwardedPorts } = this.state;
    const handleCrudSave = (list) => {
      const parsed = sortIntArray(
        _.compact(
          _.map(list, (e) => {
            const port = parseInt(e, 10);
            return _.isNumber(port) ? port : undefined;
          })
        )
      );
      setDevicesSetting(DEVICE_SETTINGS_KEYS.FORWARDED_PORTS, parsed);
      this.setState({ showForwardedPortsModal: false, forwardedPorts: parsed });
      return parsed;
    };
    return (
      <CrudList.Modal
        title="configure forwarded ports"
        onClose={this.handleForwardedPortsModalClose}
        open={this.state.showForwardedPortsModal}
        contentStyleOverrides={{ padding: 0 }}
        data={sortIntArray(forwardedPorts)}
        saveData={handleCrudSave}
      />
    );
  };

  renderToolbarComponents = () => (
    <Toolbar key="toolbar.settings">
      <ToolbarIcon
        tooltip={<span>forwarded ports</span>}
        fontAwesomeIcon={faUsb}
        onClick={this.handleForwardedPortsClick}
        key="toolbar.settings.ports"
      />
    </Toolbar>
  );

  render = () => {
    const { showForwardedPortsModal, forwardedPorts } = this.state;
    const { visible } = this.props;
    if (!visible) {
      return null;
    }
    return (
      <PluginLayout
        title="devices"
        toolbarComponents={this.renderToolbarComponents()}
      >
        <div className={css(styles.scrollWrapper)}>
          <div className={css(styles.devicesContent)}>
            {showForwardedPortsModal && this.renderForwardedPortsModal()}
            <ClientList />
            <AndroidTools forwardedPorts={forwardedPorts} />
            {global.ipc.forwarder.isAvailable() && (
              <Forwarder forwardedPorts={forwardedPorts} />
            )}
            <Blocklist />
          </div>
        </div>
      </PluginLayout>
    );
  };
}

Devices.propTypes = {
  visible: PropTypes.bool.isRequired,
};
