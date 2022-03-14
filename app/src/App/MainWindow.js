import _ from 'lodash';
import fetch from 'node-fetch';
import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { css } from 'aphrodite/no-important';
import {
  faSave,
  faFolderOpen,
  faTrashAlt,
  faPauseCircle,
  faPlayCircle,
  faCog,
} from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DEFAULT_FORWARD_PORTS } from '@plugins/Standard/Devices/Forwarder';
import { getIconForClient } from '@plugins/Standard/Devices/ClientList';
import ContextMenu from '@widgets/ContextMenu/ContextMenu';
import Modal from '@widgets/Modal/Modal';
import Button from '@widgets/Button/Button';
import Tooltip from '@widgets/Tooltip/Tooltip';
import { fileFilter } from '@lib/utils';
import { contextMenu } from '@lib/dom';
import resolvePlugins from '@plugins';
import { BackendContext } from './BackendContext';
import settings from './Settings';
import styles from './MainWindowStyles';

const lastUpdateCheck = {};
const logoIcon = require('./icon.png');

const GET_SESSION_MESSAGE = '/session/get';

const MILLISECONDS_PER_HOUR = 1000 * 60 * 60;
const UPDATE_CHECK_INTERVAL = MILLISECONDS_PER_HOUR * 1;

const UPDATE_CHECK_URL =
  'https://s3.amazonaws.com/cdns3.nerdwallet.com/piggy/version.json';

const RELEASES_URL = 'https://github.com/NerdWallet/piggy/releases';

const globalSettings = settings.get('global');

const MENU_ID = {
  IMPORT_SESSION: 'import_session',
  EXPORT_SESSION: 'export_session',
  CLEAR_SESSION: 'clear_session',
  VERSION: 'version',
};

const MENU_ITEMS = [
  {
    id: MENU_ID.EXPORT_SESSION,
    label: 'export session',
    off: true,
    icon: faSave,
  },
  {
    id: MENU_ID.IMPORT_SESSION,
    label: 'import session',
    off: true,
    icon: faFolderOpen,
  },
  {
    id: MENU_ID.CLEAR_SESSION,
    label: 'clear session',
    off: true,
    icon: faTrashAlt,
  },
  {
    id: MENU_ID.IMPORT_USER_SETTINGS,
    label: 'import user settings',
    off: true,
    icon: faCog,
  },
  {
    id: MENU_ID.VERSION,
    label: `v${global.ipc.status.version}`,
    disabled: true,
  },
];

const newVersionAvailable = () => {
  if (lastUpdateCheck.latestVersion) {
    if (
      globalSettings.get('mainWindow.ignoredUpdateVersion') ===
      lastUpdateCheck.latestVersion
    ) {
      return false;
    }
    const current = _.map(global.ipc.status.version.split('.'), (str) =>
      parseInt(str, 10)
    );
    const latest = _.map(lastUpdateCheck.latestVersion.split('.'), (str) =>
      parseInt(str, 10)
    );
    if (current.length === 3 && latest.length === 3) {
      for (let i = 0; i < 3; i++) {
        if (latest[i] > current[i]) {
          return true;
        }
        if (latest[i] < current[i]) {
          break;
        }
      }
    }
  }
  return false;
};

class MainWindow extends Component {
  constructor(props) {
    super(props);

    this.state = {
      visiblePlugin: 'eventlog',
      isPaused: false,
      showUpdateAvailableModal: false,
    };

    this.tabRefs = {};
    this.iconRef = React.createRef();
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleGetSessionMessage = this.handleGetSessionMessage.bind(this);
  }

  componentDidMount = () => {
    if (
      global.ipc.forwarder.isAvailable() &&
      !global.ipc.forwarder.isRunning()
    ) {
      global.ipc.forwarder.start(DEFAULT_FORWARD_PORTS);
    }

    global.ipc.events.emit(
      '/client/setDeviceIdBlocklist',
      globalSettings.get('devices.blocklist', [])
    );

    global.ipc.events.on(GET_SESSION_MESSAGE, this.handleGetSessionMessage);

    this.setState({
      isPaused: global.ipc.events.sendSync('/server/isPaused'),
    });

    this.loadSettings();
    this.runUpdateCheckIfNecessary();

    document.addEventListener('keydown', this.handleKeyPress, false);
  };

  componentWillUnmount = () => {
    this.saveSettings();
    document.removeEventListener('keydown', this.handleKeyPress, false);
    global.ipc.events.off(GET_SESSION_MESSAGE, this.handleGetSessionMessage);
  };

  handleGetSessionMessage(event, requestId) {
    global.ipc.events.emit(
      `/session/get/${requestId}`,
      this.parseDataForExport()
    );
  }

  handleKeyPress = (event) => {
    if (event?.code === 'Escape') {
      event.target?.blur?.();
    }
  };

  componentDidUpdate = () => {
    const { visiblePlugin } = this.state;
    globalSettings.set('mainWindow.visiblePlugin', visiblePlugin);
  };

  runUpdateCheckIfNecessary = async () => {
    const { disableUpdateCheckModal } = this.state;

    if (disableUpdateCheckModal) {
      return;
    }

    const now = Date.now();
    if (
      !lastUpdateCheck.time ||
      now - lastUpdateCheck.time >= UPDATE_CHECK_INTERVAL
    ) {
      try {
        const response = await fetch(UPDATE_CHECK_URL, { cache: 'no-store' });
        const text = await response.text();
        const json = JSON.parse(text);
        lastUpdateCheck.time = now;
        lastUpdateCheck.latestVersion = json.latestVersion;
        lastUpdateCheck.downloadUrl = json.downloadUrl;
        if (newVersionAvailable()) {
          this.setState({ showUpdateAvailableModal: true });
        }
        _.delay(this.runUpdateCheckIfNecessary, UPDATE_CHECK_INTERVAL);
      } catch (e) {
        console.log(e);
      }
    }
  };

  switchToPlugin(pluginName) {
    this.setState({
      visiblePlugin: pluginName,
    });
  }

  restoreWindow = () => {
    global.ipc.mainWindow.maximize();
  };

  maximizeWindow = () => {
    global.ipc.mainWindow.restore();
  };

  minimizeWindow = () => {
    global.ipc.mainWindow.minimize();
  };

  closeWindow = () => {
    global.ipc.mainWindow.close();
  };

  toggleServerPauseResume = () => {
    const { isPaused } = this.state;
    const message = isPaused ? '/server/resume' : '/server/pause';
    global.ipc.events.sendSync(message);
    this.setState({
      isPaused: global.ipc.events.sendSync('/server/isPaused'),
    });
  };

  saveToFile = async () => {
    const data = this.parseDataForExport();
    const options = {
      title: 'save session data',
      filters: fileFilter,
    };
    const result = await global.ipc.dialog.save(options);
    if (result && !result.canceled && result.filePath) {
      global.ipc.fs.writeFileSync(result.filePath, JSON.stringify(data));
    }
  };

  parseDataForExport = () => {
    const data = {};
    _.each(this.tabRefs, (tabRef, tabName) => {
      if (tabRef && tabRef.current && tabRef.current.exportData) {
        data[tabName] = tabRef.current.exportData();
      }
    });
    return data;
  };

  loadFromFile = async () => {
    const options = {
      title: 'load session data',
      filters: fileFilter,
      properties: ['openFile', 'createDirectory'],
    };

    const result = await global.ipc.dialog.open(options);
    if (
      result &&
      !result.cancled &&
      result.filePaths &&
      result.filePaths.length
    ) {
      const data = JSON.parse(global.ipc.fs.readFileSync(result.filePaths[0]));
      _.each(data, (value, key) => {
        const tabRef = this.tabRefs[key];
        if (tabRef && tabRef.current && tabRef.current.importData) {
          tabRef.current.importData(value);
        }
      });
    }
  };

  loadUserSettingsFile = async () => {
    const options = {
      title: 'load client settings',
      properties: ['openFile', 'createDirectory'],
    };

    const result = await global.ipc.dialog.open(options);
    if (
      result &&
      !result.cancled &&
      result.filePaths &&
      result.filePaths.length
    ) {
      settings.import('user', result.filePaths[0]);
    }
  };

  forEachTab = (predicate) => {
    _.each(this.tabRefs, (tabRef) => {
      if (tabRef && tabRef.current) {
        predicate(tabRef.current);
      }
    });
  };

  clearAllData = () => {
    global.ipc.events.sendSync('/server/clear');
    this.forEachTab((tabRef) => {
      if (tabRef.clearData) {
        tabRef.clearData();
      }
    });
  };

  loadSettings = () => {
    const { visiblePlugin: currentVisiblePlugin } = this.state;
    const visiblePlugin = globalSettings.get(
      'mainWindow.visiblePlugin',
      currentVisiblePlugin
    );
    this.setState({ visiblePlugin });
    this.forEachTab((tabRef) => {
      if (tabRef.loadSettings) {
        tabRef.loadSettings(settings);
      }
    });
  };

  saveSettings = () => {
    this.forEachTab((tabRef) => {
      if (tabRef.saveSettings) {
        tabRef.saveSettings(settings);
      }
    });
  };

  toggleIconMenu = () => {
    const { showIconMenu } = this.state;
    this.setState({
      showIconMenu: !showIconMenu,
    });
  };

  iconMenuItemClicked = ({ id }) => {
    if (id === MENU_ID.EXPORT_SESSION) {
      this.saveToFile();
    } else if (id === MENU_ID.IMPORT_SESSION) {
      this.loadFromFile();
    } else if (id === MENU_ID.CLEAR_SESSION) {
      this.clearAllData();
    } else if (id === MENU_ID.IMPORT_USER_SETTINGS) {
      this.loadUserSettingsFile();
    } else if (id === MENU_ID.VERSION) {
      global.ipc.shell.openExternal(RELEASES_URL);
    }
    this.setState({ showIconMenu: false });
  };

  disableUpdateCheckModal = () => {
    globalSettings.set(
      'mainWindow.ignoredUpdateVersion',
      lastUpdateCheck.latestVersion
    );

    this.setState({
      showUpdateAvailableModal: false,
      disableUpdateCheckModal: true,
    });
  };

  hideUpdateCheckModal = () => {
    this.setState({ showUpdateAvailableModal: false });
  };

  navigateToLatestReleasePage = () => {
    this.setState({ showUpdateAvailableModal: false });
    global.ipc.shell.openExternal(RELEASES_URL);
  };

  renderIconMenu = () => {
    const { showIconMenu } = this.state;
    if (showIconMenu) {
      return (
        <ContextMenu
          listStyle={contextMenu(this.iconRef)}
          items={MENU_ITEMS}
          onDismiss={this.toggleIconMenu}
          onItemClicked={this.iconMenuItemClicked}
        />
      );
    }
    return undefined;
  };

  renderLeftMenu = () => (
    <div className={css(styles.pluginMenu)}>
      <div
        ref={this.iconRef}
        onClick={this.toggleIconMenu}
        className={css(styles.logoContainer)}
      >
        <img
          className={css(styles.logoImage)}
          src={logoIcon.default || logoIcon}
          alt="logo"
        />
      </div>
      {this.renderPluginMenu()}
      <div key="spacer" className={css(styles.menuSpacer)} />
      {this.renderGlobalMenu()}
    </div>
  );

  renderPluginMenu = () => {
    const { visiblePlugin } = this.state;
    return resolvePlugins().map((plugin) => {
      let classes = [styles.pluginIcon];
      if (plugin.key === visiblePlugin) {
        classes = [...classes, styles.pluginIconActive];
      }
      return (
        <Tooltip
          placement="right"
          mouseEnterDelay={1.0}
          overlay={plugin.title}
          key={`${plugin.key}.tooltip`}
        >
          <div
            className={css(classes)}
            key={`${plugin.key}.icon`}
            onClick={() => {
              this.switchToPlugin(plugin.key, plugin.PluginComponent);
            }}
          >
            {plugin.fontAwesomeIcon ? (
              <FontAwesomeIcon fixedWidth icon={plugin.fontAwesomeIcon} />
            ) : (
              plugin.IconComponent
            )}
          </div>
        </Tooltip>
      );
    });
  };

  renderPluginContent = () => {
    const { visiblePlugin } = this.state;
    return resolvePlugins().map((plugin) => {
      const isVisible = plugin.key === visiblePlugin;
      const style = {
        display: isVisible ? 'flex' : 'none',
        flex: 1,
        overflow: 'auto',
      };
      if (!this.tabRefs[plugin.key]) {
        this.tabRefs[plugin.key] = React.createRef();
      }
      return (
        <div style={style} key={`${plugin.key}.content`}>
          <plugin.PluginComponent
            ref={this.tabRefs[plugin.key]}
            visible={isVisible}
          />
        </div>
      );
    });
  };

  renderGlobalMenu = () => {
    const { isPaused } = this.state;
    const icon = isPaused ? faPlayCircle : faPauseCircle;
    const style = isPaused ? styles.serverPausedIcon : styles.serverResumedIcon;
    const tooltip = isPaused
      ? 'data collection paused. click here to resume'
      : 'collecting data. click here to pause.';
    return (
      <Tooltip placement="right" overlay={tooltip}>
        <div
          className={css(styles.pluginIcon, style)}
          key="serverPauseResumeToggle.icon"
          onClick={this.toggleServerPauseResume}
        >
          <FontAwesomeIcon fixedWidth icon={icon} />
        </div>
      </Tooltip>
    );
  };

  renderTitleBar() {
    const { clients } = this.context;
    const clientIcons = _.map(clients, (client) => (
      <div
        className={css(styles.titleBarClientIcon)}
        key={`${client.address}.${client.id}.icon`}
      >
        <FontAwesomeIcon fixedWidth icon={getIconForClient(client)} />
      </div>
    ));
    return (
      <div className={css(styles.titleBar)} onDoubleClick={this.maximizeWindow}>
        <div className={css(styles.titleBarIcons)}>
          <div
            className={css([styles.titleBarIcon, styles.titleBarClose])}
            onClick={this.closeWindow}
          />
          <div
            className={css([styles.titleBarIcon, styles.titleBarMinimize])}
            onClick={this.minimizeWindow}
          />
          <div
            className={css([styles.titleBarIcon, styles.titleBarMaximize])}
            onClick={this.maximizeWindow}
          />
        </div>
        <p className={css(styles.titleBarText)}>piggy</p>
        <div className={css(styles.titleBarClientIcons)}>{clientIcons}</div>
      </div>
    );
  }

  renderUpdateCheckModal = () => {
    const { showUpdateAvailableModal } = this.state;
    if (showUpdateAvailableModal) {
      return (
        <Modal title="update check" open onClose={this.hideUpdateCheckModal}>
          <div>
            {`version '${lastUpdateCheck.latestVersion}' is available! would you like
            to download it now?`}
          </div>
          <div className={css(styles.updateCheckModalButtons)}>
            <Button onClick={this.disableUpdateCheckModal}>
              {/* eslint-disable-next-line */}
              don't remind me
            </Button>
            <Button onClick={this.hideUpdateCheckModal}>no</Button>
            <Button onClick={this.navigateToLatestReleasePage}>yes</Button>
          </div>
        </Modal>
      );
    }
    return null;
  };

  render = () => (
    <div className={css(styles.AppChrome)}>
      {this.renderUpdateCheckModal()}
      {this.renderTitleBar()}
      {this.renderIconMenu()}
      <div className={css(styles.mainHorizontalStack)}>
        {this.renderLeftMenu()}
        {this.renderPluginContent()}
      </div>
      <ToastContainer transition={Slide} />
    </div>
  );
}

MainWindow.contextType = BackendContext;

export default MainWindow;
