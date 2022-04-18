import React, { PureComponent } from 'react';
import { css } from 'aphrodite/no-important';
import { faArrowAltCircleRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import styles from './DevicesStyles';

const MESSAGE = {
  FORWARDER_STARTED: '/forwarder/started',
  FORWARDER_STOPPED: '/forwarder/stopped',
};

export default class Forwarder extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      running: global.ipc.forwarder.isRunning(),
    };
    this.handleForwarderStarted = this.handleForwarderStarted.bind(this);
    this.handleForwarderStopped = this.handleForwarderStopped.bind(this);
  }

  componentDidMount() {
    global.ipc.events.on(
      MESSAGE.FORWARDER_STARTED,
      this.handleForwarderStarted
    );
    global.ipc.events.on(
      MESSAGE.FORWARDER_STOPPED,
      this.handleForwarderStopped
    );
  }

  componentWillUnmount() {
    global.ipc.events.off(
      MESSAGE.FORWARDER_STARTED,
      this.handleForwarderStarted
    );
    global.ipc.events.off(
      MESSAGE.FORWARDER_STOPPED,
      this.handleForwarderStopped
    );
  }

  handleForwarderStarted = () => {
    this.setState({ running: true });
  };

  handleForwarderStopped = () => {
    this.setState({ running: false });
  };

  handleStart = () => {
    const { forwardedPorts } = this.props;
    global.ipc.forwarder.start(forwardedPorts);
  };

  render() {
    const { running } = this.state;

    const startButtonClass = css([
      styles.devicesBlockFooterButton,
      running && styles.devicesBlockDisabledButton,
    ]);

    const stopButtonClass = css([
      styles.devicesBlockFooterButton,
      !running && styles.devicesBlockDisabledButton,
    ]);

    let children;

    if (!running) {
      children = <div>not running.</div>;
    } else {
      const { forwardedPorts } = this.props;
      const ports = Object.keys(forwardedPorts).map((k) => (
        <div className={css(styles.devicesRowChip)}>
          {forwardedPorts[k]}:{forwardedPorts[k] + 1000}
        </div>
      ));
      children = [<div>forwarding ports</div>, ...ports];
    }

    return (
      <div className={css(styles.devicesBlock)}>
        <div className={css(styles.devicesBlockHeader)}>ios tcp over usb</div>
        <div className={css(styles.devicesBlockList)}>
          <div className={css(styles.devicesBlockListRow)}>
            {running && (
              <FontAwesomeIcon
                className={css(styles.devicesRowIcon)}
                fixedWidth
                icon={faArrowAltCircleRight}
              />
            )}
            {children}
          </div>
        </div>
        <div className={css(styles.devicesBlockFooter)}>
          <div
            className={startButtonClass}
            onClick={running ? undefined : this.handleStart}
          >
            start
          </div>
          <div
            className={stopButtonClass}
            onClick={running ? global.ipc.forwarder.stop : undefined}
          >
            stop
          </div>
        </div>
      </div>
    );
  }
}

Forwarder.propTypes = {
  forwardedPorts: PropTypes.arrayOf(PropTypes.number).isRequired,
};
