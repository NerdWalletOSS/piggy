const path = require('path');

const resolveExternalPreloads = () => {
  try {
    /* eslint-disable-next-line */
    const resolver = require('./External/preloads.js').default;
    if (resolver) {
      return resolver() || [];
    }
  } catch (e) {
    console.error('failed to load external preloads', e);
  }
  return [];
};

const preloadScript = (pluginName) =>
  path.join(__dirname, 'Standard', pluginName, 'preload.js');

const resolvePreloads = () => [
  preloadScript('ReactDevTools'),
  ...resolveExternalPreloads(),
];

exports.default = resolvePreloads;
