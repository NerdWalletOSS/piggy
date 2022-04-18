const path = require('path');

const resolveExternalPreloads = () => {
  try {
    /* eslint-disable-next-line */
    const resolver = require('./External/preloads.js').default;
    if (resolver) {
      return resolver() || [];
    }
  } catch (e) {
    console.warn('failed to load external preloads', e);
    console.warn('the warning above can probably be safely ignored...');
  }
  return [];
};

const preloadScript = (pluginName) =>
  path.join(__dirname, 'Standard', pluginName, 'preload.js');

const resolvePreloads = () => [
  preloadScript('ReactTools'),
  ...resolveExternalPreloads(),
];

exports.default = resolvePreloads;
