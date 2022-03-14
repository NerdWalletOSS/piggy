const path = require('path');

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

  return config;
};
