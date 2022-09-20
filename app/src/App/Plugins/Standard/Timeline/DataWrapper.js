import React, { Component } from 'react';
import _ from 'lodash';

const IDLE_TIME_MS = 2000;
const COLLAPSED_IDLE_DURATION_MS = 200;
const TIMELINE_UPDATE_MESSAGE = '/ws/recv/timeline/send';

export const WORK_TYPE = {
  ACTIVE: 'active',
  IDLE: 'idle',
};

export function groupCompare(left, right) {
  const priority =
    left.priority - right.priority; /* lower number = higher priority */
  return priority !== 0 ? priority : left.name.localeCompare(right.name);
}

export default function connectData(WrappedComponent) {
  return class extends Component {
    constructor(props) {
      super(props);
      this.componentRef = React.createRef();
      this.state = {
        data: {},
        rawData: [],
        excludedGroups: new Set(),
        sessionId: null,
      };
      this.handleTimelineUpdateMessage = this.handleTimelineUpdateMessage.bind(
        this
      );
    }

    componentDidMount() {
      global.ipc.events.on(
        TIMELINE_UPDATE_MESSAGE,
        this.handleTimelineUpdateMessage
      );
    };

    componentWillUnmount() {
      global.ipc.events.off(
        TIMELINE_UPDATE_MESSAGE,
        this.handleTimelineUpdateMessage
      );
    };

    handleTimelineUpdateMessage(event, message) {
      const { data: incomingRawData, sessionId } = message;
      const { sessionId: currentSessionId } = this.state;
      if (sessionId !== currentSessionId) {
        this.setState({
          rawData: incomingRawData,
          sessionId,
        });
      } else {
        this.appendRawData(incomingRawData);
      }
    }

    saveSettings = (settings) => {
      if (this.componentRef.current) {
        this.componentRef.current.saveSettings(settings);
      }
    };

    loadSettings = (settings) => {
      if (this.componentRef.current) {
        this.componentRef.current.loadSettings(settings);
      }
    };

    exportData = () => {
      const { excludedGroups } = this.state;
      return {
        version: 1,
        payload: {
          ...this.state,
          excludedGroups: Array.from(excludedGroups),
        },
      };
    };

    importData = (data) => {
      if (data && data.version === 1 && data.payload) {
        this.appendRawData(data.payload.rawData);
      }
    };

    createData = (rawData) => {
      this.setState({ rawData });
    };

    appendRawData = (additionalRawData) => {
      const { rawData } = this.state;
      const mergedRawData = [...rawData];
      additionalRawData.forEach((watch) => {
        const existingWatch = mergedRawData.find(
          (element) => element.name === watch.name
        );

        if (existingWatch) {
          existingWatch.colorHint = existingWatch.colorHint || watch.colorHint;
          const existingWork = new Set();
          existingWatch.workUnits.forEach((work) => existingWork.add(work.id));
          watch.workUnits.forEach((work) => {
            if (!existingWork.has(work.id)) {
              existingWatch.workUnits.push(work);
            }
          });
        } else {
          mergedRawData.push(watch);
        }
      });

      this.setState({
        rawData: mergedRawData,
        data: this.parseData(mergedRawData),
      });
    };

    extractTitle = (rawWorkUnit) => {
      const duration = rawWorkUnit.end - rawWorkUnit.start;
      const { context, name } = rawWorkUnit;
      let title = name;
      if (_.isString(context)) {
        title = context || title;
      } else if (_.isObject(context) && _.isString(context.title)) {
        title = context.title; // eslint-disable-line
      }
      return `[${Math.round(duration)} ms] ${title}`;
    };

    extractType = (rawWorkUnit) => {
      const { context } = rawWorkUnit;
      return context && context.type ? context.type : WORK_TYPE.ACTIVE;
    };

    collapseIdleTimes = (groupData, excludedGroups) => {
      excludedGroups = excludedGroups || this.state.excludedGroups; // eslint-disable-line

      /* this could be done with a one-liner, but it's easier to follow when
      broken apart. let's flatten all of the workUnits from all groups into
      a single array */
      let flattened = [];
      groupData.forEach((group) => {
        flattened = flattened.concat(group.workUnits);
      });

      /* let's ignore work that's specifically marked as 'idle'. we'll then
      iterate over the non-idle work units to collapse empty periods */
      flattened = _.filter(
        flattened,
        (workUnit) =>
          !excludedGroups.has(workUnit.group) && workUnit.type !== 'idle'
      );

      /* ensure all workUnits are sorted in ascending time order */
      flattened = flattened.sort((a, b) => {
        if (a.start === b.start) {
          return a.end > b.end ? -1 : 1;
        }
        return a.start > b.start ? 1 : -1;
      });

      if (flattened.length) {
        /* normalize time so we start at "0" */
        const firstTimeMs = flattened[0].start;
        flattened = _.map(flattened, (workUnit) => ({
          ...workUnit,
          start: workUnit.start - firstTimeMs,
          end: workUnit.end - firstTimeMs,
        }));

        /* let's kick things off by initializing our data with the
        first value */
        let latest = flattened[0].end;
        const collapsed = [
          {
            ...flattened[0],
          },
        ];

        /* a set of { start, end } values that represent idle periods */
        const idleTimes = [];

        /* as we step through the work items, keep track of the longest
        period of active time. we start with the first item, and will
        adjust the `start` and `end` as necessary */
        const active = {
          start: flattened[0].start,
          end: flattened[0].end,
        };

        /* accumulated total idle time determined by processing all work items */
        let totalIdleTimeMs = 0;

        for (let i = 0; i < flattened.length - 1; i++) {
          /* grab the current work item and adjust the times by removing all
          detected idle time */
          const curr = {
            ...flattened[i + 1],
            start: flattened[i + 1].start - totalIdleTimeMs,
            end: flattened[i + 1].end - totalIdleTimeMs,
          };

          if (curr.start > active.start && curr.end > active.end) {
            /* case 1: non-overlapping, where the current time slice is past the
            tracked active block. in this case we check the delta and collapse if
            necessary, then reset the active block to the current block */
            const deltaMs = curr.start - active.end;

            if (deltaMs > IDLE_TIME_MS) {
              idleTimes.push({
                start: active.end,
                end: active.end + COLLAPSED_IDLE_DURATION_MS,
              });

              /* we reduce all of the idle space between these two work items
              so there's still a gap in the data and we can draw a marker in
              the viewport */
              const collapsedDeltaMs = deltaMs - COLLAPSED_IDLE_DURATION_MS;
              totalIdleTimeMs += collapsedDeltaMs;
              curr.start -= collapsedDeltaMs;
              curr.end -= collapsedDeltaMs;
            }

            active.start = curr.start;
            active.end = curr.end;
          } else if (curr.end > active.end) {
            /* case 2: the current block ends past the active block. in this case,
            we just extend the active end to the end of the current block */
            active.end = curr.end;
          }

          collapsed.push(curr);

          if (curr.end > latest) {
            latest = curr.end;
          }
        }

        /* now that we've processed everything, let's move it back into the
        original data shape */
        const collapsedGroupData = {};
        _.each(groupData, (group) => {
          collapsedGroupData[group.name] = {
            ...group,
            workUnits: [],
          };
        });
        _.each(collapsed, (workUnit) => {
          if (collapsedGroupData[workUnit.group]) {
            collapsedGroupData[workUnit.group].workUnits.push(workUnit);
          }
        });
        _.each(groupData, (group) => {
          if (collapsedGroupData[group.name].workUnits.length === 0) {
            delete collapsedGroupData[group.name];
          }
        });
        return {
          earliest: 0,
          latest,
          groupData: collapsedGroupData,
          idleTimes,
        };
      }
      return {
        groupData: {},
        idleTimes: [],
      };
    };

    parseData = (rawData) => {
      let groupData = {};
      let allGroups = {};
      let earliest = 0;
      let latest = 0;

      if (rawData) {
        rawData.forEach((watch) => {
          const { name, priority } = watch;
          const parsedWorkUnits = [];

          allGroups[name] = { name, priority };

          watch.workUnits.forEach((rawWorkUnit) => {
            if (rawWorkUnit.start > 0 && rawWorkUnit.end > 0) {
              const duration = rawWorkUnit.end - rawWorkUnit.start;
              const type = this.extractType(rawWorkUnit);
              parsedWorkUnits.push({
                id: rawWorkUnit.id,
                content: `[${type || 'active'} ${duration} ms] ${
                  rawWorkUnit.name
                }`,
                title: this.extractTitle(rawWorkUnit),
                type,
                start: rawWorkUnit.start,
                end: rawWorkUnit.end,
                group: name,
              });

              if (earliest === 0) {
                earliest = rawWorkUnit.start;
              } else if (rawWorkUnit.start < earliest) {
                earliest = rawWorkUnit.start;
              }
              if (rawWorkUnit.end > latest) latest = rawWorkUnit.end;
            }
          });

          const existingWorkUnits = groupData[name]
            ? groupData[name].workUnits
            : [];

          groupData[name] = {
            ...watch,
            workUnits: _.sortBy(existingWorkUnits.concat(parsedWorkUnits), [
              'start',
            ]),
          };
        });
      }

      allGroups = Object.values(allGroups)
        .sort(groupCompare)
        .map((group) => group.name);

      groupData = Object.values(groupData);

      const idleTimeData = this.collapseIdleTimes(groupData);

      return {
        allGroups,
        absoluteTimeData: {
          groupData,
          latest,
          earliest,
        },
        relativeTimeData: {
          ...idleTimeData,
        },
      };
    };

    toggleExclude = (groupName) => {
      if (!groupName) return;
      const { excludedGroups, data } = this.state;
      const updatedGroups = new Set(excludedGroups);
      if (updatedGroups.has(groupName)) {
        updatedGroups.delete(groupName);
      } else {
        updatedGroups.add(groupName);
      }
      this.setState({
        excludedGroups: updatedGroups,
        data: {
          ...data,
          relativeTimeData: this.collapseIdleTimes(
            data.absoluteTimeData.groupData,
            updatedGroups
          ),
        },
      });
    };

    clearData = () => {
      this.setState({
        data: {},
        rawData: [],
      });
    };

    render() {
      const wrappedProps = {
        ...this.props,
        ...this.state,
        toggleExclude: this.toggleExclude,
        clearData: this.clearData,
      };
      return <WrappedComponent ref={this.componentRef} {...wrappedProps} />;
    };
  };
}
