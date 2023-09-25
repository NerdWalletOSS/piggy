import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import { css } from 'aphrodite/no-important';
import {
  faFilter,
  faArrowsAltH,
  faCompress,
  faStream,
} from '@fortawesome/free-solid-svg-icons';
import { GlobalHotKeys } from 'react-hotkeys';
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import { Toolbar, ToolbarIcon } from '@widgets/Toolbar';
import DropDownList from '@widgets/ContextMenu/ContextMenu';
import PluginLayout from '@widgets/Plugin/PluginLayout';
import Tooltip from '@widgets/Tooltip/Tooltip';
import { contextMenu } from '@lib/dom';
import settings from '@app/Settings';
import styles, { getBarStyle, getTitleStyle } from './TimelineStyles';
import connectData from './DataWrapper';

const globalSettings = settings.get('global');

const MOUSE_BUTTON = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
};

const KEY_MAP = {
  SET_FIT_ON: 'home',
  TOGGLE_FIT: 'z',
  TOGGLE_FILTERS: 'f',
  CLEAR_DATA: 'c',
  COMMAND_DOWN: [
    { sequence: 'command', action: 'keydown' },
    { sequence: 'ctrl', action: 'keydown' },
  ],
  COMMAND_UP: [
    { sequence: 'command', action: 'keyup' },
    { sequence: 'ctrl', action: 'keyup' },
  ],
};

class Timeline extends PureComponent {
  constructor(props) {
    super(props);
    this.filterIconRef = React.createRef();
    this.isDragModifierDown = false;
    this.state = {
      offsetX: 0, // the amount scrolled right
      isDragging: false,
      dragButton: null,
      timeScale: 1000, // the amount of ms to show on the screen at once,
      fit: true,
      showFilters: false,
      collapsedV: true,
      collapsedH: true,
      collapsedOverrides: {},
    };
    this.keyHandlers = {
      SET_FIT_ON: () => {
        this.setState({ fit: true });
      },
      TOGGLE_FIT: this.toggleFit,
      TOGGLE_FILTERS: this.toggleFilters,
      CLEAR_DATA: () => {
        const { clearData } = this.props;
        clearData();
      },
      COMMAND_DOWN: () => {
        this.isDragModifierDown = true;
      },
      COMMAND_UP: () => {
        this.isDragModifierDown = false;
      },
    };
  }

  saveSettings = () => {
    const { collapsedV, collapsedH } = this.state;
    globalSettings.set('timeline.collapsedV', collapsedV);
    globalSettings.set('timeline.collapsedH', collapsedH);
  };

  /* eslint-disable-next-line react/no-unused-class-component-methods */
  loadSettings = () => {
    this.setState({
      collapsedV: globalSettings.get('timeline.collapsedV', true),
      collapsedH: globalSettings.get('timeline.collapsedH', true),
    });
  };

  onDrag = (evt) => {
    const { isDragging, dragButton } = this.state;

    if (!isDragging || !this.isDragModifierDown) {
      return false;
    }

    if (dragButton === MOUSE_BUTTON.RIGHT) {
      this.updateTimeScale(evt.movementX * 15);
    } else {
      this.updateOffset(evt.movementX);
    }

    return false;
  };

  getDataRangeInfo = () => {
    const data = this.getTimingData();
    const { earliest, latest } = data;
    const { fit, timeScale, offsetX } = this.state;

    const totalTime = latest - earliest;
    const currentScale = fit
      ? totalTime + totalTime * 0.01 // show the entire range + 1% of the range on the right past the end line to keep the end line visible
      : timeScale;

    const markers = _.range(
      offsetX,
      currentScale + offsetX,
      _.ceil(currentScale / 10)
    );

    return { latest, earliest, currentScale, markers };
  };

  updateOffset = (amount) => {
    const { offsetX, timeScale } = this.state;
    let updatedOffsetX = offsetX - (amount * (timeScale / 100)) / 2;
    if (updatedOffsetX < 0) {
      updatedOffsetX = 0;
    }
    this.setState({
      offsetX: updatedOffsetX,
    });
  };

  toggleFit = () => {
    const { fit } = this.state;
    const { currentScale } = this.getDataRangeInfo();
    const newState = {
      fit: !fit,
      timeScale: currentScale,
    };

    // if we are turning the fit On, we want to snap the offset to 0, otherwise leave it at the last offset
    if (!fit) {
      newState.offsetX = 0;
    }
    this.setState(newState);
  };

  toggleFilters = () => {
    const { showFilters } = this.state;
    this.setState({ showFilters: !showFilters });
  };

  toggleCollapseV = () => {
    const { collapsedV } = this.state;
    this.setState(
      {
        collapsedV: !collapsedV,
        collapsedOverrides: {},
      },
      this.saveSettings
    );
  };

  toggleCollapseH = () => {
    const { collapsedH } = this.state;
    this.setState({ collapsedH: !collapsedH }, this.saveSettings);
  };

  updateTimeScale = (delta) => {
    const { currentScale } = this.getDataRangeInfo();
    let newTimescale = currentScale;
    if (delta > 5) {
      newTimescale += _.ceil(delta, -1);
      this.setState({ timeScale: _.ceil(newTimescale, 0), fit: false });
    }

    if (delta < -5) {
      newTimescale += _.floor(delta, -1);
      if (newTimescale < 10) {
        newTimescale = 10;
      }

      this.setState({ timeScale: _.ceil(newTimescale, 0), fit: false });
    }
  };

  getTimingData = () => {
    const { collapsedH } = this.state;
    const { data } = this.props;
    if (collapsedH) {
      const { relativeTimeData } = data;
      return relativeTimeData || {};
    }
    const { absoluteTimeData } = data;
    return absoluteTimeData || {};
  };

  toggleStopwatchExpandedState = (name) => {
    const { collapsedOverrides } = this.state;
    const updatedValue = !collapsedOverrides[name];
    this.setState({
      collapsedOverrides: {
        ...collapsedOverrides,
        [name]: updatedValue,
      },
    });
  };

  renderExpandedStopwatch = (width, left, name, type, colorHint, title) => (
    <div
      style={{
        width: `${width}%`,
        left: `${left}%`,
        minWidth: 1,
      }}
      className={css([styles.bar, getBarStyle(name, type, colorHint)])}
    >
      <div className={css(styles.barTitle)}>{title}</div>
    </div>
  );

  renderCollapsedStopwatch = (width, left, name, type, colorHint) => (
    <div
      style={{
        width: `${width}%`,
        left: `${left}%`,
        minWidth: 1,
        display: 'inline-block',
        position: 'absolute',
      }}
      className={css([styles.bar, getBarStyle(name, type, colorHint)])}
    />
  );

  renderEvents = () => {
    const { excludedGroups } = this.props;
    const { offsetX, collapsedV, collapsedOverrides } = this.state;
    const data = this.getTimingData();
    let { groupData } = data;
    const { idleTimes } = data;

    if (_.isEmpty(groupData)) return null;

    groupData = _.sortBy(groupData, 'priority');

    const { earliest, latest, currentScale, markers } = this.getDataRangeInfo();

    const events = _.compact(
      groupData.map((stopwatch) => {
        if (excludedGroups.has(stopwatch.name)) {
          return null;
        }

        let renderer;

        if (collapsedOverrides[stopwatch.name]) {
          renderer = collapsedV
            ? this.renderExpandedStopwatch
            : this.renderCollapsedStopwatch;
        } else {
          renderer = collapsedV
            ? this.renderCollapsedStopwatch
            : this.renderExpandedStopwatch;
        }

        const trigger = collapsedV ? ['hover'] : ['click'];

        // get event bar data
        const bars = stopwatch.workUnits.map((workUnit) => {
          // figure out how to show the bar
          const workTime = workUnit.end - workUnit.start;
          const startTime = earliest + offsetX;
          const startDifference = workUnit.start - startTime;

          // determine the distance from the left of the screen
          const leftPercentage = (startDifference / currentScale) * 100;

          // determine length of the bar
          const workLength = (workTime / currentScale) * 100;

          return (
            <Tooltip
              trigger={trigger}
              placement="topLeft"
              overlay={workUnit.content}
            >
              {renderer(
                workLength,
                leftPercentage,
                stopwatch.name,
                workUnit.type,
                stopwatch.colorHint,
                workUnit.title
              )}
            </Tooltip>
          );
        });

        if (!_.isEmpty(bars)) {
          // display grouped bars
          return (
            <div className={css(styles.track)}>
              <div
                className={css([
                  styles.groupTitle,
                  getTitleStyle(stopwatch.name, stopwatch.colorHint),
                ])}
                onClick={() =>
                  this.toggleStopwatchExpandedState(stopwatch.name)
                }
              >
                <div className={css(styles.groupTitleText)}>
                  <div>{stopwatch.name}</div>
                  <div
                    className={css(styles.groupTitlePriority)}
                  >{`[priority: ${stopwatch.priority}]`}</div>
                </div>
              </div>
              <div className={css(styles.barGroup)}>{bars}</div>
            </div>
          );
        }

        return null;
      })
    );

    const grid = markers.map((time, i) => {
      const percentage = (i / markers.length) * 100;
      return (
        <div
          style={{
            left: `${percentage}%`,
          }}
          className={css(styles.gridLine)}
        />
      );
    });

    // determine the distance from the left of the screen
    const leftEndPercentage =
      ((latest - (earliest + offsetX)) / currentScale) * 100;
    const lastTimeRecordedLine = (
      <div
        style={{
          left: `${leftEndPercentage}%`,
        }}
        className={css(styles.lastEventLine)}
      />
    );

    let idleTimeMarkers = [];
    if (idleTimes && idleTimes.length) {
      idleTimeMarkers = idleTimes.map(({ start, end }) => {
        const deltaMs = start - (earliest + offsetX);
        const leftPercentage = (deltaMs / currentScale) * 100;
        const widthPercent = ((end - start) / currentScale) * 100;
        const message = `idle time: ${deltaMs}ms`;
        return (
          <Tooltip overlay={message}>
            <div
              className={css(styles.idleMarker)}
              style={{
                left: `${leftPercentage}%`,
                width: `${widthPercent}%`,
                minWidth: '1px',
              }}
            />
          </Tooltip>
        );
      });
    }

    return (
      <div
        className={css(styles.timelineWindow)}
        onWheel={(evt) => {
          if (evt.deltaX && this.isDragModifierDown) {
            // evt.preventDefault();
            this.updateTimeScale(evt.deltaX);
          }
        }}
        onMouseDown={(evt) => {
          this.setState({ isDragging: true, dragButton: evt.button });
        }}
        onMouseUp={() => {
          this.setState({ isDragging: false, dragButton: null });
        }}
        onMouseMove={this.onDrag}
      >
        <div>
          {grid}
          {lastTimeRecordedLine}
        </div>
        {events}
        {idleTimeMarkers}
      </div>
    );
  };

  renderTimeScale = () => {
    const { markers } = this.getDataRangeInfo();

    const timescaleDisplay = markers.map((time, i) => {
      const percentage = (i / markers.length) * 100;
      return (
        <div
          style={{
            left: `${percentage}%`,
          }}
          className={css(styles.timescaleCell)}
        >
          <div style={{ padding: 4 }}>{_.ceil(time, 2)}ms</div>
        </div>
      );
    });

    return <div className={css(styles.timescale)}>{timescaleDisplay}</div>;
  };

  renderEmpty = () => (
    <div className={css(styles.emptyContainer)}>
      <div>go use the app and timing data will show up here.</div>
    </div>
  );

  renderFilterList = () => {
    const { showFilters } = this.state;

    if (!showFilters) {
      return false;
    }

    const { data, excludedGroups, toggleExclude } = this.props;

    if (!data || !data.allGroups) {
      return null;
    }

    const items = _.uniq(
      data.allGroups.map((group) => ({
        label: group,
        off: excludedGroups.has(group),
      }))
    );

    return (
      <DropDownList
        items={items}
        listStyle={contextMenu(this.filterIconRef)}
        emptyLabel="no data, no filters"
        onItemClicked={(item) => toggleExclude(item.label)}
        onDismiss={() => this.setState({ showFilters: false })}
      />
    );
  };

  renderToolbar = () => {
    const { clearData } = this.props;
    const { showFilters, fit, collapsedV, collapsedH } = this.state;

    return (
      <Toolbar>
        <ToolbarIcon
          isOn={!collapsedV}
          tooltip={<span>expand data vertically</span>}
          fontAwesomeIcon={faStream}
          onClick={this.toggleCollapseV}
        />
        <ToolbarIcon
          isOn={collapsedH}
          tooltip={<span>collapse idle data</span>}
          fontAwesomeIcon={faCompress}
          onClick={this.toggleCollapseH}
        />
        <ToolbarIcon
          isOn={showFilters}
          ref={this.filterIconRef}
          tooltip={<span>toggle filters</span>}
          fontAwesomeIcon={faFilter}
          onClick={this.toggleFilters}
        />
        <ToolbarIcon
          isOn={fit}
          tooltip={
            <span>
              fit to window:
              {fit ? ' on' : ' off'}
            </span>
          }
          fontAwesomeIcon={faArrowsAltH}
          onClick={this.toggleFit}
        />
        <ToolbarIcon
          alwaysVisible
          tooltip={<span>clear data</span>}
          fontAwesomeIcon={faTrashAlt}
          onClick={clearData}
        />
      </Toolbar>
    );
  };

  render() {
    const { visible } = this.props;

    if (!visible) {
      return null;
    }

    const { groupData } = this.getTimingData();

    const content = _.isEmpty(groupData)
      ? this.renderEmpty()
      : [this.renderEvents(), this.renderTimeScale()];

    const toolbarComponents = [this.renderToolbar()];

    return (
      <GlobalHotKeys keyMap={KEY_MAP} handlers={this.keyHandlers}>
        <PluginLayout title="timeline" toolbarComponents={toolbarComponents}>
          <div className={css(styles.wrapper)}>
            <div className={css([styles.eventAndScaleContainer])}>
              {content}
            </div>
            {this.renderFilterList()}
          </div>
        </PluginLayout>
      </GlobalHotKeys>
    );
  }
}

Timeline.propTypes = {
  data: PropTypes.object.isRequired,
  excludedGroups: PropTypes.object.isRequired,
  toggleExclude: PropTypes.func.isRequired,
  clearData: PropTypes.func.isRequired,
  visible: PropTypes.bool.isRequired,
};

export default connectData(Timeline);
