import _ from 'lodash';
import { NativeModule } from './native-module';
import {
  TIMELINE_PRIORITIES,
  EVENT_TYPE,
  EVENT_LEVEL,
  COLOR_HINT,
  FEATURE,
} from './constants';
import eventLog from './eventlog';
import timeline from './timeline';

/* ~10 million 16 bit characters = ~20 megabytes; chosen arbitrarily
to keep things bounded */
const MAX_HTTP_BODY_LENGTH = 1024 * 1024 * 10;

const DEFAULT_STOPWATCH_NAME = 'HTTP (other)';
const logger = console.logger('Piggy/http');

let colorHint = COLOR_HINT.BLUE;
let hostnameToAlias = {};
let config = {};

const filteredLogEvent = async (event) => {
  if (!config || !config.enabled) {
    return;
  }

  /* let's not report requests/responses to internal tooling */
  if (
    event.type === EVENT_TYPE.HTTP_REQUEST ||
    event.type === EVENT_TYPE.HTTP_RESPONSE
  ) {
    const url = event.data.url || '';
    if (
      !url ||
      url.startsWith(`http://${config.hostname}`) ||
      url.startsWith('http://localhost') ||
      url.startsWith('http://10.0.2.2')
    ) {
      return;
    }
  }

  eventLog.send(event);
};

const addXhrHookIfEnabled = async () => {
  const enabled = config && config.enabled && config.features[FEATURE.HTTP];

  if (!enabled) {
    logger.log('Piggy.http not enabled!');
    return;
  }

  if (_.isObject(config.features[FEATURE.HTTP])) {
    colorHint = config.features[FEATURE.HTTP].colorHint || colorHint;
  }

  logger.log('Piggy.http is enabled!');

  const getHostname = (url) =>
    url.replace('http://', '').replace('https://', '').split('/')[0];

  const sanitizeHttpEventData = (event) => {
    /* let's not report payloads larger than 100k by default */
    if (_.get(event, 'data.parameters.data.length') > MAX_HTTP_BODY_LENGTH) {
      _.set(event, 'data.parameters.data', 'request data too large; omitted');
    }
    if (_.get(event, 'data.parameters.body.length') > MAX_HTTP_BODY_LENGTH) {
      _.set(event, 'data.parameters.body', 'request data too large; omitted');
    }
    return event;
  };

  /* cookies are automatically, transparently injected into the request by
  JS runtime, so we explicitly extract them from the native cookie store
  for the specified request and attach them to the payload for tooling */
  const getCookies = async (url) => {
    if (url && url.indexOf('://') !== 0) {
      /* this decomposes a url into just the scheme and path. e.g:
      https://www.nerdwallet.com/some/long/path gets parsed into:
      https://www.nerdwallet.com. we'll ask the native layer for
      cookies for this hostname. */
      const parts = url.split('://');
      const hostname = `${parts[0]}://${parts[1].split('/')[0]}`;
      const cookies = await NativeModule.getCookies(hostname);
      return _.map(cookies, (value, key) => `${key}=${value}`).join('; ');
    }
    return undefined;
  };

  const logHttpRequest = async (request, id) => {
    const data = _.cloneDeep(request);
    data.headers = data.headers || {};
    data.headers.Cookie = await getCookies(request.url);
    filteredLogEvent(
      sanitizeHttpEventData({
        type: EVENT_TYPE.HTTP_REQUEST,
        level: EVENT_LEVEL.INFO,
        colorHint: COLOR_HINT.BLUE,
        data: {
          id,
          url: request.url,
          parameters: data,
        },
      })
    );
  };

  const logHttpResponse = (response, id) => {
    filteredLogEvent(
      sanitizeHttpEventData({
        type: EVENT_TYPE.HTTP_RESPONSE,
        level: EVENT_LEVEL.INFO,
        colorHint: COLOR_HINT.BLUE,
        data: {
          id,
          url: response.finalUrl || response.url,
          parameters: _.cloneDeep(response),
        },
      })
    );
  };

  const XHR = window.XMLHttpRequest;
  const originalXhrOpen = XHR.prototype.open;
  const originalXhrSend = XHR.prototype.send;
  const originalXhrSetRequestHeader = XHR.prototype.setRequestHeader;

  XHR.prototype.open = function open(...args) {
    this.__openArguments = [...args];
    this.__requestHeaders = {};
  };

  XHR.prototype.setRequestHeader = function setRequestHeader(header, value) {
    if (this.__requestHeaders[header]) {
      if (!_.isArray(this.__requestHeaders[header])) {
        this.__requestHeaders[header] = [this.__requestHeaders[header], value];
      } else {
        this.__requestHeaders[header].push(value);
      }
    } else {
      this.__requestHeaders[header] = value;
    }
  };

  XHR.prototype.send = function send(body) {
    // eslint-disable-next-line consistent-this
    const instance = this;

    const method = this.__openArguments[0];
    const url = this.__openArguments[1];
    const withCredentials = !!this.__openArguments[2];

    const hostname = getHostname(url || '');
    const stopwatchName = hostnameToAlias[hostname] || DEFAULT_STOPWATCH_NAME;
    const work = timeline
      .stopwatch(stopwatchName, TIMELINE_PRIORITIES.HTTP_REQUEST, { colorHint })
      .start(url);

    logHttpRequest(
      {
        body,
        headers: this.__requestHeaders,
        method,
        url,
        withCredentials,
      },
      work.workId
    );

    this.addEventListener('loadend', () => {
      work.stop();
      if (
        FileReader /* eslint-disable-line no-undef */ &&
        this.responseType &&
        this.responseType.indexOf('blob') !== -1 &&
        this.response &&
        this.response.data
      ) {
        // eslint-disable-next-line no-undef
        const reader = new FileReader();
        reader.addEventListener('loadend', (e) => {
          if (e && e.target) {
            logHttpResponse(
              {
                data: e.target.result,
                headers: instance.responseHeaders,
                status: instance.status,
                url,
                finalUrl: this.responseURL,
              },
              work.workId
            );
          }
        });
        reader.readAsText(this.response);
      } else {
        logHttpResponse(
          {
            data: this.response,
            headers: instance.responseHeaders,
            status: instance.status,
            url,
            finalUrl: this.responseURL,
          },
          work.workId
        );
      }
    });

    originalXhrOpen.call(this, ...this.__openArguments);

    _.each(this.__requestHeaders, (value, key) => {
      const values = _.isArray(value) ? value : [value];
      _.each(values, (v) => {
        originalXhrSetRequestHeader.call(instance, key, v);
      });
    });

    return originalXhrSend.call(this, body);
  };
};

const setHostnameToAliasMap = (map) => {
  hostnameToAlias = _.isPlainObject(map) ? map : {};
};

const setConfiguration = (updatedConfiguration) => {
  config = updatedConfiguration;
  addXhrHookIfEnabled();
};

export default { setHostnameToAliasMap, setConfiguration };
