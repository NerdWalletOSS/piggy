const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

console.log('loading custom webpack config overlay...');

module.exports = function override(config) {
  config.resolve = {
    ...config.resolve,
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/App/'),
      '@widgets': path.resolve(__dirname, 'src/App/Widgets'),
      '@plugins': path.resolve(__dirname, 'src/App/Plugins'),
      '@lib': path.resolve(__dirname, 'src/App/Lib'),
    },
  };
  /* unclear why, but the console polyfill causes weird errors in the
  render process: "Relative imports outside of src/ are not supported" */
  config.plugins = [
    ...(config.plugins || []),
    new NodePolyfillPlugin({ excludeAliases: ['console'] }),
  ];
  return config;
};
