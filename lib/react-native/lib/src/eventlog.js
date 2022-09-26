import _ from 'lodash';
import { deepClean } from './util';
import { FEATURE, WEBSOCKET_MESSAGE_TYPE } from './constants';
import webSocket from './websocket';

const logger = console.logger('NativeModules/eventlog');

let enabled = false;

/* calling code can configure value "redactors" for any event type.
these can be used to filter sensitive (or other undesireable) data
that should not show up in tooling */
const EVENT_TYPE_TO_REDACTOR = {};

const setRedactorForEventType = (type, redactor) => {
  if (!redactor) {
    delete EVENT_TYPE_TO_REDACTOR[type];
  } else if (_.isFunction(redactor)) {
    EVENT_TYPE_TO_REDACTOR[type] = redactor;
  }
};

const eventFormatter = async (event) => {
  try {
    const redactor = EVENT_TYPE_TO_REDACTOR[event.type];
    const sanitized = await deepClean(event, redactor);
    sanitized.timestamp = Date.now();
    return sanitized;
  } catch (e) {
    logger.warn(`piggy: failed to log event with type ${event.type}`);
  }
  return undefined;
};

const send = (event) => {
  if (!enabled) {
    return;
  }

  /* note we defer actually formatting the message until it's about to be
  sent. that way we don't do unnecessary work if the WebSocket never connects */
  webSocket.sendMessage(
    WEBSOCKET_MESSAGE_TYPE.SEND_EVENT_LOG,
    event,
    eventFormatter
  );
};

const setConfiguration = (config) => {
  enabled = config.features[FEATURE.EVENT_LOG];
};

export default { send, setConfiguration, setRedactorForEventType };
