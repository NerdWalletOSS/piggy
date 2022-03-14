import _ from 'lodash';
import {
  EVENT_TYPES,
  RAW_HTTP_TYPES,
  RAW_NAVIGATION_TYPES,
} from './EventConstants';
import { parseHttpDataAsJson, formatItemType } from './utils';

const EVENT_PREFIX = {
  NAVIGATION: 'navigation/',
  HTTP: 'http/',
};

let nextId = 0;

export default class EventFormatter {
  constructor(props) {
    this.props = props;
    this.pendingEvents = [];
    this.httpRequestEvents = {};
    this.navigationEvents = {};
  }

  addItem(item) {
    this.pendingEvents.push(_.cloneDeep(item));
    this.scheduleUpdate();
  }

  reset() {
    this.httpRequestEvents = {};
    this.navigationEvents = {};
    this.pendingEvents = [];
  }

  /* eslint-disable-next-line */
  processEvent(event, index) {
    /* for subclass use */
    return false;
  }

  processConsoleEvent = (item) => {
    /* backwards compatibility -- older versions of the tooling used
    `item.args`, but it was later changed to `item.data = [...arguments]` */
    item.data = item.data || [];
    item.data = item.data.arguments || item.data;
  };

  processHttpEvent = (item, index, events) => {
    /* hoist these up for easier processing in the ui */
    item.url =
      item.url ||
      _.get(item, 'data.parameters.url') ||
      _.get(item, 'data.parameters.finalUrl');
    item.id = item.id || _.get(item, 'data.id');

    /* 'request|response' */
    const subtype = item.type.split('/')[1];
    item.data.subtype = subtype;

    parseHttpDataAsJson(item);

    if (item.type === RAW_HTTP_TYPES.HTTP_REQUEST) {
      this.httpRequestEvents[item.data.id] = item;
      item.data = {
        request: item.data.parameters,
      };
    } else if (item.type === RAW_HTTP_TYPES.HTTP_RESPONSE) {
      const request = this.httpRequestEvents[item.data.id];
      if (request) {
        request.level = item.level || request.level;
        request.data.response = item.data.parameters;
        delete events[index];
      } else {
        item.data = {
          response: item.data.parameters,
        };
      }
    }

    item.type = EVENT_TYPES.HTTP;
  };

  processNavigationEvent = (item, index, events) => {
    /* hoist this up for easier processing in the UI */
    item.event = item.data.event;

    /* 'request|resolve|reject|broadcast' */
    const subtype = item.type.split('/')[1];
    item.data.subtype = subtype;

    if (item.type === RAW_NAVIGATION_TYPES.REQUEST) {
      this.navigationEvents[item.data.id] = item;
      item.data = { request: item.data };
    } else if (item.type === RAW_NAVIGATION_TYPES.BROADCAST) {
      item.data = { broadcast: item.data };
    } else {
      const request = this.navigationEvents[item.data.id];
      if (request) {
        request.level = item.level || request.level;
        request.data[subtype] = item.data;
        delete events[index];
      } else {
        item.data = { response: item.data };
      }
    }

    item.type = EVENT_TYPES.NAVIGATION;
  };

  scheduleUpdate = _.throttle(() => {
    this.processNextBatch();
  }, 250);

  processNextBatch = () => {
    if (!this.pendingEvents.length) {
      return;
    }

    const itemTypes = new Set();

    _.each(this.pendingEvents, (item, index) => {
      _.set(item, 'id', nextId++);
      if (!item || !item.type) {
        console.error('no or invalid item detected!', item);
      } else {
        itemTypes.add(formatItemType(item.type));
        /* coerce 'log' level to 'info'. TODO: fix this in the libraries */
        item.level = item.level === 'log' ? 'info' : item.level;
        if (!this.processEvent(item, index)) {
          if (item.type === EVENT_TYPES.CONSOLE) {
            this.processConsoleEvent(item);
          } else if (item.type.indexOf(EVENT_PREFIX.HTTP) === 0) {
            this.processHttpEvent(item, index, this.pendingEvents);
          } else if (item.type.indexOf(EVENT_PREFIX.NAVIGATION) === 0) {
            this.processNavigationEvent(item, index, this.pendingEvents);
          }
        }
      }
      if (this.props.onItemProcessed) {
        this.props.onItemProcessed(item);
      }
    });

    if (this.props.onBatchProcessed) {
      this.props.onBatchProcessed({
        processedEvents: _.compact(this.pendingEvents),
        itemTypes,
      });
    }

    this.pendingEvents = [];
  };
}
