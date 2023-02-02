import _ from 'lodash';
import React, { Component } from 'react';
import getPluginIntegrations from '@plugins/integrations';
import serverProxy from '@app/ServerProxy';
import eventFilter from './EventFilter';
import EventFormatter from './EventFormatter';
import { FILTER_TYPES } from './EventConstants';
import { sortByTimestampAndId, formatItemType } from './utils';

const MAX_ITEMS = 1500;
const EVENT_NAME = '/eventLog/send';

export default function connectData(WrappedComponent) {
  return class extends Component {
    constructor(props) {
      super(props);

      const integrations = getPluginIntegrations('eventlog');

      const blocklists = _.compact(
        integrations.map((i) => i.EVENT_TYPE_BLOCKLIST)
      );

      this.eventTypeBlocklist = new Set(
        blocklists.reduce((result, list) => [...result, ...list], [])
      );

      this.eventFormatter = new EventFormatter({
        onBatchProcessed: this.handleBatchProcessed,
      });

      this.state = {
        rawEvents: [],
        events: [],
        types: [],
        filterType: FILTER_TYPES.NORMAL,
        markedItems: new Set(),
        highlightedItems: new Set(),
        markedOnly: false,
        excludes: new Set(),
        excludedLevels: new Set(),
        sessionId: -1,
        filter: '',
        deepFilter: false,
      };

      this.handleEventLogEvent = this.handleEventLogEvent.bind(this);
    }

    componentDidMount() {
      serverProxy.onWs(EVENT_NAME, this.handleEventLogEvent);
    }

    componentWillUnmount() {
      serverProxy.offWs(EVENT_NAME, this.handleEventLogEvent);
    }

    handleEventLogEvent = (message) => {
      const { sessionId } = message;
      const { sessionId: currentSessionId } = this.state;
      if (currentSessionId !== sessionId) {
        this.clearData({ sessionId });
      }
      if (!this.eventTypeBlocklist.has(message.data.type)) {
        this.eventFormatter.addItem(message.data);
      }
    };

    handleBatchProcessed = ({ processedEvents, itemTypes }) => {
      const {
        types,
        rawEvents: originalRawEvents,
        excludes,
        excludedLevels,
        filter,
      } = this.state;

      const mergedItemTypes = new Set(types);
      itemTypes.forEach((t) => mergedItemTypes.add(t));

      let rawEvents = originalRawEvents.concat(processedEvents);
      if (rawEvents.length > MAX_ITEMS) {
        rawEvents = rawEvents.slice(rawEvents.length - MAX_ITEMS);
      }

      rawEvents.sort(sortByTimestampAndId);

      this.setState({
        rawEvents,
        events: this.applyFilter(rawEvents, excludes, excludedLevels, filter),
        highlightedItems: this.applyHighlight(rawEvents),
        types: Array.from(mergedItemTypes).sort(),
      });
    };

    exportData = () => {
      const { markedItems, excludes } = this.state;
      const payload = {
        ...this.state,
        markedItems: Array.from(markedItems),
        excludes: Array.from(excludes),
      };
      delete payload.excludedLevels;
      return { version: 1, payload };
    };

    importData = (data) => {
      if (data && data.version === 1 && data.payload) {
        const updatedState = {
          ...data.payload,
          markedItems: new Set(data.payload.markedItems),
          excludes: new Set(data.payload.excludes),
        };
        updatedState.events = this.applyFilter(
          updatedState.rawEvents,
          updatedState.excludes
        );
        updatedState.highlightedItems = this.applyHighlight(
          updatedState.rawEvents
        );
        this.setState(updatedState);
      }
    };

    clearData = (options = {}) => {
      const { sessionId } = this.state;
      this.eventFormatter.reset();
      this.setState({
        rawEvents: [],
        events: [],
        types: [],
        markedItems: new Set(),
        sessionId: options.sessionId || sessionId,
      });
    };

    toggleDeepFilter = () => {
      const { deepFilter } = this.state;
      this.setState(
        {
          deepFilter: !deepFilter,
        },
        () => {
          this.setState({
            events: this.applyFilter(),
          });
        }
      );
    };

    toggleExclude = (set, value) => {
      const updated = new Set(set);
      if (updated.has(value)) {
        updated.delete(value);
      } else {
        updated.add(value);
      }
      return updated;
    };

    toggleExcludedType = (type) => {
      const { rawEvents, excludes, excludedLevels, filter } = this.state;
      const updatedExcludes = this.toggleExclude(excludes, type);
      this.setState({
        events: this.applyFilter(
          rawEvents,
          updatedExcludes,
          excludedLevels,
          filter
        ),
        excludes: updatedExcludes,
      });
    };

    toggleExcludedLevel = (level) => {
      const { rawEvents, excludes, excludedLevels, filter } = this.state;
      const updatedLevels = this.toggleExclude(excludedLevels, level);
      this.setState({
        events: this.applyFilter(rawEvents, excludes, updatedLevels, filter),
        excludedLevels: updatedLevels,
      });
    };

    toggleMarkedOnly = () => {
      const { markedOnly } = this.state;
      this.setState({ markedOnly: !markedOnly }, this.refilter);
    };

    toggleItemMark = (item) => {
      const { markedItems, markedOnly } = this.state;
      const updated = new Set(markedItems);
      if (updated.has(item.id)) {
        updated.delete(item.id);
      } else {
        updated.add(item.id);
      }
      this.setState({ markedItems: updated }, () => {
        if (markedOnly) {
          this.refilter();
        }
      });
    };

    setFilterType = (filterType) => {
      this.setState(
        {
          filterType,
        },
        () => {
          this.setState({
            events: this.applyFilter(),
            highlightedItems: this.applyHighlight(),
          });
        }
      );
    };

    updateFilter = (filter) => {
      const {
        filter: currentFilter,
        rawEvents,
        excludes,
        excludedLevels,
      } = this.state;
      if (filter === currentFilter) {
        return;
      }
      this.setState({
        filter,
        events: this.applyFilter(
          rawEvents,
          excludes,
          excludedLevels,
          filter || ''
        ),
        highlightedItems: this.applyHighlight(rawEvents, filter),
      });
    };

    refilter = () => {
      this.setState({ events: this.applyFilter() });
    };

    applyHighlight = (
      rawEvents = this.state.rawEvents, // eslint-disable-line
      filter = this.state.filter // eslint-disable-line
    ) => {
      const result = new Set();
      if (filter) {
        const { filterType, deepFilter } = this.state;
        if (filterType === FILTER_TYPES.HIGHLIGHT) {
          rawEvents.forEach((item) => {
            if (eventFilter(item, filter, deepFilter)) {
              result.add(item.id);
            }
          });
        }
      }
      return result;
    };

    applyFilter = (
      rawEvents = this.state.rawEvents, // eslint-disable-line
      excludes = this.state.excludes, // eslint-disable-line
      excludedLevels = this.state.excludedLevels, // eslint-disable-line
      filter = this.state.filter // eslint-disable-line
    ) => {
      const { filterType, markedOnly, markedItems, deepFilter } = this.state;
      return _.isEmpty(excludes) &&
        _.isEmpty(excludedLevels) &&
        !filter &&
        !markedOnly
        ? [...rawEvents]
        : _.filter(
            rawEvents,
            (item) =>
              !excludedLevels.has(item.level) &&
              !excludes.has(formatItemType(item.type)) &&
              (!markedOnly || markedItems.has(item.id)) &&
              (filterType !== FILTER_TYPES.NORMAL ||
                eventFilter(item, filter, deepFilter))
          );
    };

    render() {
      const wrappedProps = {
        ...this.props,
        ...this.state,
        clearData: this.clearData,
        toggleDeepFilter: this.toggleDeepFilter,
        toggleExcludedLevel: this.toggleExcludedLevel,
        toggleExcludedType: this.toggleExcludedType,
        toggleItemMark: this.toggleItemMark,
        toggleMarkedOnly: this.toggleMarkedOnly,
        setFilterType: this.setFilterType,
        updateFilter: this.updateFilter,
      };
      return <WrappedComponent {...wrappedProps} />;
    }
  };
}
