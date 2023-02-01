import _ from 'lodash';

const SERVER_MESSAGE_TYPE = {
  WEBSOCKET: 'websocket',
  HTTP: 'http',
};

const registry = {
  /* we can have multiple handlers for websocket messages, as they
  may be informative broadcasts */
  [SERVER_MESSAGE_TYPE.WEBSOCKET]: {},
  /* we enforce a single handler for HTTP requests */
  [SERVER_MESSAGE_TYPE.HTTP]: {},
};

const sanitizePath = (path) => (path[0] === '/' ? path : `/${path}`);

const handleHttpMessage = async (_event, requestId, request) => {
  const handler = registry[SERVER_MESSAGE_TYPE.HTTP][request.url];
  if (!handler) {
    global.ipc.events.emit(requestId, {
      statusCode: 404,
      data: { error: 'no handler found' },
    });
    return;
  }
  let response = await handler.callback(request);
  if (!response.data) {
    response = {
      data: response,
      statusCode: 200,
    };
  }
  global.ipc.events.emit(requestId, response);
};

const register = (type, path, callback) => {
  const sanitizedPath = sanitizePath(path);
  if (type === SERVER_MESSAGE_TYPE.WEBSOCKET) {
    const fullPath = `/ws/recv${sanitizedPath}`;
    const handlers =
      registry[SERVER_MESSAGE_TYPE.WEBSOCKET][sanitizedPath] || [];
    const existing = _.find(
      handlers,
      (e) => e.path === sanitizedPath && e.callback === callback
    );
    if (existing) {
      console.error(
        `${type} message for ${sanitizedPath} already registered with the specified callback`
      );
      return;
    }
    handlers.push({ path: sanitizedPath, callback });
    registry[SERVER_MESSAGE_TYPE.WEBSOCKET][sanitizedPath] = handlers;
    global.ipc.events.on(fullPath, callback);
  } else if (type === SERVER_MESSAGE_TYPE.HTTP) {
    if (registry[SERVER_MESSAGE_TYPE.HTTP][sanitizedPath]) {
      console.error(`${type} message for ${sanitizedPath} already registered.`);
      return;
    }
    registry[SERVER_MESSAGE_TYPE.HTTP][sanitizedPath] = {
      path: sanitizedPath,
      callback,
    };
  }
};

const unregister = (type, path, callback) => {
  const sanitizedPath = sanitizePath(path);
  if (type === SERVER_MESSAGE_TYPE.HTTP) {
    const existing = registry[SERVER_MESSAGE_TYPE.HTTP][sanitizedPath];
    if (!existing) {
      console.error(
        `${type} message for ${sanitizedPath} is *NOT* registered.`
      );
      return;
    }
    if (existing.callback !== callback) {
      console.error(
        `${type} message for ${sanitizedPath} is registered, but with a different callback.`
      );
      return;
    }
    delete registry[SERVER_MESSAGE_TYPE.HTTP][sanitizedPath];
  } else if (type === SERVER_MESSAGE_TYPE.WEBSOCKET) {
    const fullPath = `/ws/recv${sanitizedPath}`;
    registry[SERVER_MESSAGE_TYPE.WEBSOCKET][sanitizedPath] = _.filter(
      registry[SERVER_MESSAGE_TYPE.WEBSOCKET][sanitizedPath] || [],
      (e) => e.path !== sanitizedPath || e.callback !== callback
    );
    global.ipc.events.off(fullPath, callback);
  }
};

global.ipc.events.on('/http/get', handleHttpMessage);

const onWs = (path, callback) => {
  register(SERVER_MESSAGE_TYPE.WEBSOCKET, path, callback);
};

const offWs = (path, callback) => {
  unregister(SERVER_MESSAGE_TYPE.WEBSOCKET, path, callback);
};

const onHttp = (path, callback) => {
  register(SERVER_MESSAGE_TYPE.HTTP, path, callback);
};

const offHttp = (path, callback) => {
  unregister(SERVER_MESSAGE_TYPE.HTTP, path, callback);
};

const emitWs = (path, data = {}) => {
  const sanitizedPath = sanitizePath(path);
  global.ipc.events.emit('/ws/send', {
    name: sanitizedPath,
    data,
  });
};

export default { emitWs, onWs, offWs, onHttp, offHttp };
