import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import SplitterLayout from 'react-splitter-layout';
import { GlobalHotKeys } from 'react-hotkeys';
import { css } from 'aphrodite/no-important';
import {
  faSearchPlus,
  faFilter,
  faBookmark,
  faAngleDoubleDown,
  faBug,
  faInfoCircle,
  faExclamationTriangle,
  faSkull,
  faHighlighter,
  faCog,
} from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { Toolbar, ToolbarIcon } from '@widgets/Toolbar';
import PluginLayout from '@widgets/Plugin/PluginLayout';
import ContextMenu from '@widgets/ContextMenu/ContextMenu';
import SearchableDetailsPane from '@widgets/SearchableDetailsPane/SearchableDetailsPane';
import { contextMenu } from '@lib/dom';
import EventLogVirtualList from '@plugins/Standard/EventLog/EventLogVirtualList';
import CrudList from '@widgets/CrudList/CrudList';
import settings from '@app/Settings';
import connectData from './DataWrapper';
import styles from './EventLogStyles';
import EventLogItem from './EventLogItem';
import { FILTER_TYPES } from './EventConstants';
import { debouncedUpdate, getItemLabel, getItemTitle } from './utils';

const globalSettings = settings.get('global');

const DEFAULT_PATHS = ['item.data'];

const MENU_ID = {
  COPY_CURL: 'url_copy_curl',
  COPY_URL: 'url_copy_url',
  COPY_HEADERS: 'url_copy_headers',
};

const URL_MENU_ITEMS = [
  {
    id: MENU_ID.COPY_CURL,
    label: 'copy cURL',
    off: true,
  },
  {
    id: MENU_ID.COPY_URL,
    label: 'copy url',
    off: true,
  },
  {
    id: MENU_ID.COPY_HEADERS,
    label: 'copy headers',
    off: true,
  },
];

export const KEY_MAP = {
  CLOSE_DETAILS_DATA: 'esc',
  TOGGLE_DETAILS_SEARCH: ['command+f', 'ctrl+f'],
};

const requestToCurl = (request) => {
  const escape = (text) => text && text.replace(/'/g, "\\'");
  const preamble = `curl -X ${request.method} '${request.url}'`;
  const headers = _.map(
    request.headers || {},
    (value, key) =>
      `-H '${escape(key)}: ${escape(_.isArray(value) ? value[0] : value)}'`
  ).join(' \\\n');
  let data = '';
  const body = request.body || request.data;
  if (body && _.size(body)) {
    data = `\\\n -d '${escape(JSON.stringify(body))}'`;
  }
  return `${preamble} \\\n${headers} ${data}`.trim();
};

class EventLog extends PureComponent {
  constructor(props) {
    super(props);
    this.listRef = null;
    this.inputRef = React.createRef();
    this.filterIconRef = React.createRef();
    this.state = {
      detailsData: null,
      urlModalData: null,
      showFiltersEvent: null,
      showDetailsSearch: false,
      showSettingsModal: false,
      scrollPinnedToBottom: true,
      userDefinedDataPaths: globalSettings.get(
        'eventlog.searchSettings.userDefinedDataPaths',
        []
      ),
      filter: '',
    };
    this.keyHandlers = {
      CLOSE_DETAILS_DATA: this.closeDetails,
      TOGGLE_DETAILS_SEARCH: this.toggleShowDetailsSearch,
    };
  }

  componentDidUpdate(prevProps) {
    const { events: prevEvents } = prevProps;
    const { events } = this.props;
    const { detailsData } = this.state;
    const prevCount = prevEvents.length;
    const count = events.length;
    if (count) {
      const detailsValid =
        detailsData &&
        events.length > detailsData.index &&
        events[detailsData.index].id === detailsData.itemId;
      if (!prevCount || (detailsData && !detailsValid)) {
        const event = events[0];
        this.setDetailsData({
          index: 0,
          item: event,
          itemId: event.id,
          label: getItemLabel(event),
          title: getItemTitle(event),
          showTitle: false,
        });
      }
    }
  };

  onInputChange = () => {
    const filter = this.inputRef.current.value;
    const { updateFilter } = this.props;
    this.setState({ filter });
    debouncedUpdate(filter, updateFilter);
  };

  setDetailsData = (data) => {
    this.setState({
      detailsData: data,
    });
  };

  clearDataClicked = () => {
    const { clearData } = this.props;
    clearData();
    this.setState({
      urlModalData: null,
      detailsData: null,
    });
  };

  closeDetails = () => {
    if (this.state.showDetailsSearch) {
      this.toggleShowDetailsSearch();
    } else {
      this.setDetailsData(null);
    }
  };

  toggleShowDetailsSearch = () => {
    this.setState((prevState) => ({
      showDetailsSearch: !prevState.showDetailsSearch,
    }));
  };

  closeUrlMenu = () => {
    this.setState({ urlModalData: null });
  };

  urlMenuItemClicked = (item) => {
    const { urlModalData } = this.state;
    const request = _.get(urlModalData, 'item.data.request');
    const url = _.get(urlModalData, 'item.url');
    const writeToClipboard = global.ipc.clipboard.write;
    if (item.id === MENU_ID.COPY_CURL) {
      writeToClipboard(requestToCurl(request));
    } else if (item.id === MENU_ID.COPY_URL) {
      writeToClipboard(url);
    } else if (item.id === MENU_ID.COPY_HEADERS) {
      writeToClipboard(JSON.stringify(request.headers, 0, 2));
    }
    this.closeUrlMenu();
  };

  toggleFilters = (ev) => {
    this.setState({ showFiltersEvent: { x: ev.clientX, y: ev.clientY } });
  };

  toggleSettings = () => {
    this.setState((prevState) => ({
      showSettingsModal: !prevState.showSettingsModal,
    }));
  };

  renderSettings = () => {
    const { showSettingsModal, userDefinedDataPaths } = this.state;
    if (!showSettingsModal) {
      return null;
    }
    const handleModalClose = () => {
      this.setState({
        showSettingsModal: false,
      });
    };
    const handleCrudSave = (list) => {
      const compacted = _.compact(list);
      globalSettings.set(
        'eventlog.searchSettings.userDefinedDataPaths',
        compacted
      );
      this.setState({
        userDefinedDataPaths: compacted,
        showSettingsModal: false,
      });
      return compacted;
    };
    return (
      <CrudList.Modal
        title="configure data sections"
        onClose={handleModalClose}
        open={showSettingsModal}
        contentStyleOverrides={{ padding: 0 }}
        data={userDefinedDataPaths}
        saveData={handleCrudSave}
        emptyText="no data sections configured"
      />
    );
  };

  pinToBottomChanged = (pinned) => {
    this.setState({ scrollPinnedToBottom: pinned });
  };

  pinToBottom = () => {
    if (this.listRef) {
      this.listRef.scrollToBottomAndPin();
    }
  };

  renderUrlMenu = () => {
    const { urlModalData } = this.state;
    return (
      <ContextMenu
        listStyle={contextMenu(null, urlModalData.event)}
        items={URL_MENU_ITEMS}
        onDismiss={this.closeUrlMenu}
        onItemClicked={this.urlMenuItemClicked}
      />
    );
  };

  renderToolbarComponents() {
    const { filter, showFiltersEvent, scrollPinnedToBottom } = this.state;
    const {
      markedOnly,
      filterType,
      setFilterType,
      toggleMarkedOnly,
      toggleExcludedLevel,
      toggleDeepFilter,
      deepFilter,
      excludedLevels,
    } = this.props;

    const filterTypeToggle =
      filterType === FILTER_TYPES.NORMAL
        ? FILTER_TYPES.HIGHLIGHT
        : FILTER_TYPES.NORMAL;

    return [
      <Toolbar key="toolbar.filter" className={styles.toolbarComponent}>
        <ToolbarIcon
          tooltip={<span>settings</span>}
          fontAwesomeIcon={faCog}
          onClick={this.toggleSettings}
          key="toolbar.filter.settings"
        />
        <ToolbarIcon
          isOn={deepFilter}
          tooltip={<span>deep search</span>}
          fontAwesomeIcon={faSearchPlus}
          onClick={() => toggleDeepFilter('info')}
          key="toolbar.filter.deep"
        />
        <ToolbarIcon
          isOn={filterType === FILTER_TYPES.HIGHLIGHT}
          tooltip={<span>highlight search</span>}
          fontAwesomeIcon={faHighlighter}
          onClick={() => setFilterType(filterTypeToggle)}
          key="toolbar.filter.type"
        />
      </Toolbar>,
      <input
        onChange={this.onInputChange}
        placeholder="search"
        className={css(styles.searchInput, styles.toolbarComponent)}
        value={filter}
        ref={this.inputRef}
        key="toolbar.search"
      />,
      <Toolbar key="toolbar.logLevel" className={styles.toolbarComponent}>
        <ToolbarIcon
          isOn={!excludedLevels.has('info')}
          tooltip={<span>show log/info</span>}
          fontAwesomeIcon={faInfoCircle}
          onClick={() => toggleExcludedLevel('info')}
          key="toolbar.logLevel.info"
        />
        <ToolbarIcon
          isOn={!excludedLevels.has('debug')}
          tooltip={<span>show debug</span>}
          fontAwesomeIcon={faBug}
          onClick={() => toggleExcludedLevel('debug')}
          key="toolbar.logLevel.debug"
        />
        <ToolbarIcon
          isOn={!excludedLevels.has('warn')}
          tooltip={<span>show warnings</span>}
          fontAwesomeIcon={faExclamationTriangle}
          onClick={() => toggleExcludedLevel('warn')}
          key="toolbar.logLevel.warn"
        />
        <ToolbarIcon
          isOn={!excludedLevels.has('error')}
          tooltip={<span>show errors</span>}
          fontAwesomeIcon={faSkull}
          onClick={() => toggleExcludedLevel('error')}
          key="toolbar.logLevel.error"
        />
      </Toolbar>,
      <Toolbar key="toolbar.misc">
        <ToolbarIcon
          isOn={!!showFiltersEvent}
          tooltip={<span>show filters</span>}
          fontAwesomeIcon={faFilter}
          ref={this.filterIconRef}
          onClick={this.toggleFilters}
          key="toolbar.misc.showFilters"
        />
        <ToolbarIcon
          isOn={scrollPinnedToBottom}
          tooltip={<span>pin scroll to bottom</span>}
          fontAwesomeIcon={faAngleDoubleDown}
          onClick={this.pinToBottom}
          key="toolbar.misc.pinToBottom"
        />
        <ToolbarIcon
          isOn={markedOnly}
          tooltip={<span>hide/show bookmarked items</span>}
          fontAwesomeIcon={faBookmark}
          onClick={toggleMarkedOnly}
          key="toolbar.misc.markedOnly"
        />
        <ToolbarIcon
          isOn={false}
          tooltip={<span>clear data</span>}
          fontAwesomeIcon={faTrashAlt}
          onClick={this.clearDataClicked}
          key="toolbar.misc.clearData"
        />
      </Toolbar>,
    ];
  }

  renderFilterList = () => {
    const { showFiltersEvent } = this.state;
    const { types, excludes, toggleExcludedType } = this.props;

    if (!showFiltersEvent) {
      return null;
    }

    const items = _.map(types, (type) => ({
      label: type,
      off: excludes.has(type),
    }));

    return (
      <ContextMenu
        items={items}
        emptyLabel="no data, no filters"
        listStyle={contextMenu(this.filterIconRef, showFiltersEvent)}
        onItemClicked={(item) => toggleExcludedType(item.label)}
        onDismiss={() => this.setState({ showFiltersEvent: null })}
      />
    );
  };

  renderEmpty = () => {
    const { filter } = this.state;
    const message = filter
      ? `nothing matches the filter '${filter}'`
      : 'nothing seems to have happened yet. go use the app!';
    return (
      <div className={css(styles.wrapper)}>
        <div className={css(styles.emptyContainer)}>
          <div>{message}</div>
        </div>
      </div>
    );
  };

  renderMainContent = (left, right) => {
    if (!right) {
      return left;
    }
    return (
      <div>
        <SplitterLayout secondaryInitialSize={33} percentage>
          {left}
          {right}
        </SplitterLayout>
      </div>
    );
  };

  renderList = (count) => {
    const { markedItems, highlightedItems, events } = this.props;
    const { urlModalData, detailsData } = this.state;
    const selectedItemId = _.get(detailsData, 'itemId');
    return (
      <EventLogVirtualList
        itemType={EventLogItem}
        eventHandler={this}
        events={events}
        count={count}
        selectedItemId={selectedItemId}
        markedItems={markedItems}
        highlightedItems={highlightedItems}
        disablePinToBottom={!!urlModalData}
        pinToBottomChanged={this.pinToBottomChanged}
      />
    );
  };

  renderDetails = () => {
    const { detailsData, showDetailsSearch, userDefinedDataPaths } = this.state;
    const showTitle = detailsData?.showTitle ?? false;
    const searchConfig = {
      detailSectionPaths: userDefinedDataPaths.length
        ? userDefinedDataPaths
        : DEFAULT_PATHS,
    };
    return detailsData ? (
      <SearchableDetailsPane
        showTitle={showTitle}
        detailsData={detailsData}
        showDetailsSearch={showDetailsSearch}
        toggleShowDetailsSearch={this.toggleShowDetailsSearch}
        searchConfig={searchConfig}
      />
    ) : null;
  };

  render() {
    const { visible, events } = this.props;

    if (!visible) {
      return null;
    }

    const count = events.length;
    const { urlModalData } = this.state;
    return (
      <GlobalHotKeys keyMap={KEY_MAP} handlers={this.keyHandlers}>
        <PluginLayout
          title="event log"
          toolbarComponents={this.renderToolbarComponents()}
        >
          {this.renderSettings()}
          <div className={css(styles.EventLog)}>
            {urlModalData && this.renderUrlMenu()}
            {count
              ? this.renderMainContent(
                  this.renderList(count),
                  this.renderDetails()
                )
              : this.renderEmpty()}
            {this.renderFilterList()}
          </div>
        </PluginLayout>
      </GlobalHotKeys>
    );
  }
}

EventLog.propTypes = {
  /* properties */
  deepFilter: PropTypes.bool.isRequired,
  filterType: PropTypes.string.isRequired,
  events: PropTypes.array.isRequired,
  excludedLevels: PropTypes.object.isRequired,
  excludes: PropTypes.object.isRequired,
  markedItems: PropTypes.object.isRequired,
  markedOnly: PropTypes.bool.isRequired,
  highlightedItems: PropTypes.object.isRequired,
  types: PropTypes.array.isRequired,
  visible: PropTypes.bool.isRequired,
  /* functions */
  clearData: PropTypes.func.isRequired,
  toggleDeepFilter: PropTypes.func.isRequired,
  toggleExcludedLevel: PropTypes.func.isRequired,
  toggleExcludedType: PropTypes.func.isRequired,
  toggleMarkedOnly: PropTypes.func.isRequired,
  setFilterType: PropTypes.func.isRequired,
  updateFilter: PropTypes.func.isRequired,
};

export default connectData(EventLog);
