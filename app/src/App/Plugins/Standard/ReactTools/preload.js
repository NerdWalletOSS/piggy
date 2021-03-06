/* port -> connection */
const instances = {};

const stop = async (port) => {
  const ports =
    port === undefined || port === null ? Object.keys[instances] : [port];
  for (let i = 0; i < ports.length; i++) {
    const instance = instances[ports[i]];
    if (instance) {
      /* eslint-disable-next-line no-await-in-loop */
      await instance.close();
      delete instances[port];
    }
  }
};

const start = async (port, elementId) => {
  await global.ipc.reactDevTools.stop(port);
  const element = document.getElementById(elementId);
  const module = require('react-devtools-core/standalone');
  const standalone = module.default;
  standalone.setStatusListener((status) => {
    if (status === 'Failed to start the server.') {
      console.error(
        '[ReactDevTools]',
        `Failed to start React DevTools server with port \`${port}\`, is another server listening?`
      );
      delete instances[port];
    }
  });
  standalone.setContentDOMNode(element);
  const server = standalone.startServer(port);
  instances[port] = { server, elementId };
};

const isRunning = (port) => !!instances[port];

exports.default = {
  start: (ipc) => {
    ipc.reactDevTools = { stop, start, isRunning };
  },
};
