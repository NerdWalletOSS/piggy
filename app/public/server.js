const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const electron = require('electron');

const { ipcMain } = electron;

const app = express();
require('express-ws')(app);

let connections = {};
let connectionId = 0;
let requestId = 0;
let deviceIdBlocklist = [];
let paused = false;
let pendingMessages = [];

app.use(bodyParser.json({ limit: '100mb' }));

app.get('/session', (req, res) => {
  const id = requestId++;
  ipcMain.emit('/session/get', `${id}`);
  ipcMain.once(`/session/get/${id}`, (event, data) => {
    res.write(JSON.stringify(data));
    res.end();
  });
});

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
  ipcMain.emit('/client/connected', client);
  ws.on('message', (message) => {
    const parsed = JSON.parse(message);
    if (parsed.name && parsed.data) {
      if (!paused) {
        ipcMain.emit('/ws/recv', parsed);
      } else {
        pendingMessages.push(parsed);
      }
    }
  });
  ws.on('close', () => {
    delete connections[id];
    ipcMain.emit('/client/disconnected', client);
  });
});

ipcMain.on('/ws/send', (event, { name, data }) => {
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

ipcMain.on('/client/setDeviceIdBlocklist', (event, blocklist) => {
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
      ipcMain.emit('/client/disconnected', connection.info);
    }
  });
});

ipcMain.on('/server/pause', (event) => {
  paused = true;
  pendingMessages = [];
  event.returnValue = true;
  console.log('server paused.');
});

ipcMain.on('/server/resume', (event) => {
  paused = false;
  event.returnValue = true;
  pendingMessages.forEach((message) => ipcMain.emit('/ws/recv', message));
  pendingMessages = [];
  console.log('server resumed');
});

ipcMain.on('/server/isPaused', (event) => {
  console.log('server isPaused?', paused);
  event.returnValue = paused;
});

ipcMain.on('/server/clear', (event) => {
  pendingMessages = [];
  event.returnValue = true;
  console.log('pending messages cleared');
});

exports.start = () => {
  try {
    console.log('server starting...');
    app.listen(8347, () => {
      console.log('server started');
      ipcMain.emit('/server/connected');
    });
  } catch (err) {
    console.log(err);
  }
};
