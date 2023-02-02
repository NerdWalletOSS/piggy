const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
require('express-ws')(app);

const HTTP_REQUEST_TIMEOUT_MS = 30000;

let running = false;
let ipcProxy;
let connections = {};
let connectionId = 0;
let requestId = 0;
let deviceIdBlocklist = [];
let paused = false;
let pendingMessages = [];

app.use(bodyParser.json({ limit: '100mb' }));

/**
 * We allow the main window (and its plugins) to accept and respond to HTTP requests
 * made against the server. This allows for programmatic control of `piggy`. For
 * example, QA can use a `curl` request to dump a session log by hitting the
 * `http://piggyip:8347/api/session` endpoint.
 *
 * This mechanism works by accepting all reqeusts against the `/api/*` path and
 * emitting an `/http/get` event to the renderer process. Then, within the
 * renderer process, `ServiceProxy` handles the message and dispatches it
 * accordingly. The handler returns a response to `ServiceProxy`, which emits a
 * response event to the server process. The server then responds to the inbound
 * request with the provided data.
 *
 * By default, `ServiceProxy` will immediately return a 404 for requests that do
 * not have registered handlers. There is also a hard-coded 30 second timeout for
 * all requests; if there is a handler registered in `ServiceProxy`, but it takes
 * longer than 30 seconds, its result will be ignored and an 500 is returned.
 */
app.get('/api/*', (req, res) => {
  /* hack off the `/api` prefix */
  const url = req.url.substring('/api'.length);
  const { method, params, query, headers } = req;
  const data = { url, method, params, query, headers };
  const id = `/http/get${url}/${requestId++}`;
  ipcProxy.emitToRenderer('/http/get', id, data);
  console.log(`server: emitting /http/get for ${url}`);
  let timeoutId;
  const sendResponse = (_event, result) => {
    console.log(`server: sending response for /http/get${url} with id=${id}`);
    clearTimeout(timeoutId);
    const statusCode = result.statusCode || 200;
    let { data: responseBody, contentType } = result;
    if (!contentType) {
      if (_.isObject(responseBody)) {
        responseBody = JSON.stringify(responseBody);
        contentType = 'application/json';
      } else if (_.isString(responseBody)) {
        responseBody = String(responseBody);
        contentType = 'text/plain';
      }
    }
    res
      .type(contentType)
      .status(statusCode)
      .write(responseBody || '');
    res.end();
  };
  timeoutId = setTimeout(() => {
    console.warn(
      `server: timeout waiting for response for /http/get${url} with id=${id}`
    );
    sendResponse(
      {},
      {
        statusCode: 500,
        data: { error: 'timeout' },
      }
    );
    ipcProxy.offRenderer(id, sendResponse);
  }, HTTP_REQUEST_TIMEOUT_MS);
  ipcProxy.onceRenderer(id, sendResponse);
});

/**
 * Start up a WebSocket server for bi-directional communication between piggy
 * and an external (generally mobile) application. Every message sent and
 * retrieved should have the following structure:
 *
 * Messages received from the external application are sent to the renderer
 * process via `/ws/recv` event, and are handled in `ServiceProxy` like they
 * are for HTTP requests.
 *
 * {
 *   name: '/slash/delimited/message/name',
 *   data: { ...plain json object with any shape you want }
 * }
 */
app.ws('/', (ws, req) => {
  const deviceId = (req.query && req.query.deviceId) || 'unknown';
  if (deviceIdBlocklist.indexOf(deviceId) >= 0) {
    ws.close();
    return;
  }
  const id = connectionId++;
  const address = req.connection.remoteAddress;
  const type = (req.query && req.query.type) || 'unknown';
  const client = { address, type, id, deviceId };
  /* note that some runtimes, like RN on Android, don't always properly clean up
  WebSockets when doing a soft reload. to work around this, if we have existing
  connections with the same type and deviceId as this connection, go ahead
  and clean up those old connections now */
  const prevConnections = connections;
  connections = {};
  const stale = [];
  _.each(Object.keys(prevConnections), (currentId) => {
    const connection = prevConnections[currentId];
    if (connection) {
      if (
        connection.info.deviceId === deviceId &&
        connection.info.type === type
      ) {
        /* found an older version of this deviceId+type pair. let's add this to
        the style set so we can close it in favor of the new connection */
        stale.push(connection);
      } else {
        /* otherwise, maintain it */
        connections[currentId] = connection;
      }
    }
  });
  _.each(stale, (connection) => {
    console.log(
      `terminating stale connection deviceId=${deviceId} type=${type}`
    );
    connection.ws.close();
  });
  connections[id] = { socket: ws, info: client };
  console.log(
    `connected: ${address} with type=${type} deviceId=${deviceId} id=${id}`
  );
  ipcProxy.emitToRenderer('/client/connected', client);
  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.name && parsedMessage.data) {
      if (!paused) {
        ipcProxy.emitToRenderer(`/ws/recv`, parsedMessage);
      } else {
        pendingMessages.push(parsedMessage);
      }
    }
  });
  ws.on('close', () => {
    delete connections[id];
    ipcProxy.emitToRenderer('/client/disconnected', client);
  });
});

/**
 * We allow the renderer process (i.e. the app window) very basic control of the
 * servers we run, so we can expose UI for pausing input or establishing client
 * blocklists. We also provide a message that can be used for the app to send
 * WebSocket messages to the connected app.
 *
 * Here, we register for those events once the main window becomes available.
 */
const registerRendererEvents = () => {
  /**
   * This is a generic message that the main window can use to send a WebSocket
   * message to the connected external (mobile) app.
   */
  ipcProxy.onRenderer('/ws/send', (event, { name, data }) => {
    if (Object.keys(connections).length) {
      const message = JSON.stringify({ name, data });
      Object.values(connections).forEach((connection) =>
        connection.socket.send(message)
      );
    } else {
      console.warn(
        'trying to send a websocket message, but no clients connected!'
      );
    }
  });

  /**
   * In QA environments there are sometimes multiple devices that connected to
   * the same machine, and sometimes they should be excluded from using the app.
   * The client can tell us which devices to ignore.
   */
  ipcProxy.onRenderer('/client/setDeviceIdBlocklist', (event, blocklist) => {
    deviceIdBlocklist = blocklist || [];
    console.log('updating blocklist', ...deviceIdBlocklist);
    Object.keys(connections).forEach((key) => {
      const connection = connections[key];
      if (deviceIdBlocklist.indexOf(connection.info.deviceId) >= 0) {
        console.warn(
          `closing existing connection with deviceId=${connection.info.deviceId}`
        );
        connection.socket.close(1011, 'blocklisted');
        delete connections[key];
        ipcProxy.emitToRenderer('/client/disconnected', connection.info);
      }
    });
  });

  /**
   * The following are for general server-level control: pausing, resuming, and
   * clearing the active session. The user in the app may be debugging something
   * and want to pause further UI updates so they can inspect the state of their
   * tools, so we provide a mechanism to do this.
   */
  ipcProxy.onRenderer('/server/pause', (event) => {
    paused = true;
    pendingMessages = [];
    event.returnValue = true;
    console.log('server paused.');
  });

  ipcProxy.onRenderer('/server/resume', (event) => {
    paused = false;
    event.returnValue = true;
    pendingMessages.forEach((message) =>
      ipcProxy.emitToRenderer('/ws/recv', message)
    );
    pendingMessages = [];
    console.log('server resumed');
  });

  ipcProxy.onRenderer('/server/isPaused', (event) => {
    console.log('server isPaused?', paused);
    event.returnValue = paused;
  });

  ipcProxy.onRenderer('/server/clear', (event) => {
    pendingMessages = [];
    event.returnValue = true;
    console.log('pending messages cleared');
  });
};

module.exports = {
  init: (ipc) => {
    ipcProxy = ipc;
  },
  start: () => {
    if (running) {
      console.log('server: already running.');
      return;
    }
    if (!ipcProxy) {
      console.error('server: please call init() first');
      return;
    }
    try {
      console.log('server starting...');
      registerRendererEvents();
      app.listen(8347, () => {
        running = true;
        console.log('server started');
        ipcProxy.emitToRenderer('/server/connected');
      });
    } catch (err) {
      console.log(err);
    }
  },
};
