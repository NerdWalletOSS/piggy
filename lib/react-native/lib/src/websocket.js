import ReconnectingWebSocket from 'reconnecting-websocket';
import EventEmitter from 'eventemitter3';

const logger = console.logger('Piggy/websocket');

const MAX_PENDING_WEBSOCKET_MESSAGES = 250;

const messageEmitter = new EventEmitter();
let config = { enabled: false };
let webSocket;
let webSocketReady = false;
let pendingWebSocketMessages = [];

const sendMessage = async (name, data, processor) => {
  const message = { name, data, sessionId: config.sessionId };
  if (
    config &&
    config.enabled &&
    config.sessionId &&
    webSocket &&
    webSocketReady
  ) {
    if (processor) {
      message.data = await processor(data);
    }
    webSocket.send(JSON.stringify(message));
  } else {
    pendingWebSocketMessages.push({ message, processor });
    const diff =
      pendingWebSocketMessages.length - MAX_PENDING_WEBSOCKET_MESSAGES;
    if (diff > 0) {
      pendingWebSocketMessages = pendingWebSocketMessages.slice(diff);
    }
  }
};

const start = async () => {
  if (!config && !config.enabled) {
    console.info('websocket not enabled yet. not connecting!');
    return;
  }

  logger.debug('websocket enabled. connecting!', config);

  webSocket = new ReconnectingWebSocket(
    `ws://${config.hostname}?type=javascript&deviceId=${config.deviceId}`
  );

  webSocket.onopen = async () => {
    logger.debug('websocket connected');
    webSocketReady = true;
    /* dispatch any messages that were enqueued before the socket became available */
    for (let i = 0; i < pendingWebSocketMessages.length; i++) {
      const { message, processor } = pendingWebSocketMessages[i];
      if (!message.sessionId) {
        message.sessionId = config.sessionId;
      }
      if (processor) {
        /* eslint-disable-next-line */
        message.data = await processor(message.data);
      }
      webSocket.send(JSON.stringify(message));
    }
    pendingWebSocketMessages = [];
  };

  webSocket.onclose = () => {
    webSocketReady = false;
  };

  webSocket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    messageEmitter.emit(message.name, message.data);
  };
};

const setConfiguration = (updatedConfig) => {
  config = updatedConfig;
  if (webSocket) {
    webSocket.close();
    webSocket = null;
  }
  start(config);
};

export default {
  sendMessage,
  messageEmitter,
  setConfiguration,
};
