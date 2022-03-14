import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { css } from 'aphrodite/no-important';
import PluginLayout from '@widgets/Plugin/PluginLayout';
import styles from './DevicesStyles';
import ClientList from './ClientList';
import AndroidTools from './AndroidTools';
import Forwarder from './Forwarder';
import Blocklist from './Blocklist';

export default class Devices extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { visible } = this.props;
    if (!visible) {
      return null;
    }
    return (
      <PluginLayout title="devices">
        <div className={css(styles.scrollWrapper)}>
          <div className={css(styles.devicesContent)}>
            <ClientList />
            <AndroidTools />
            {global.ipc.forwarder.isAvailable() && <Forwarder />}
            <Blocklist />
          </div>
        </div>
      </PluginLayout>
    );
  }
}

Devices.propTypes = {
  visible: PropTypes.bool.isRequired,
};
