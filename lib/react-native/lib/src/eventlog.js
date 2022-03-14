import _ from 'lodash';
import removeCircularReferences from './smart-circular';
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

const circularReferenceRedactionCustomizer = (redactor) => {
  if (!redactor) {
    return undefined;
  }
  return (value, path) => {
    // This is the way that the SC library extracts the terminal key from its path format
    // https://github.com/Keenpoint/smart-circular/blob/master/smart-circular.js#L49
    const terminalKey = path
      .slice(1, path.length - 1)
      .split('][')
      .pop();
    if (redactor({ path, key: terminalKey })) {
      return '<redacted>';
    }
    return value;
  };
};

const eventFormatter = async (event) => {
  try {
    const redactor = EVENT_TYPE_TO_REDACTOR[event.type];

    /* RN sometimes has problems sending functions over the bridge, so we
    strip them. also, circular references sometimes cause issues, so we
    strip those as well */
    const sanitized = await deepClean(
      removeCircularReferences(
        _.cloneDeep(event),
        circularReferenceRedactionCustomizer(redactor)
      )
    );
    sanitized.timestamp = Date.now();
    return sanitized;
  } catch (e) {
    logger.warn(`NWTooling: failed to log event with type ${event.type}`);
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
