import _ from 'lodash';
import resolveStandardPlugins from '@plugins/Standard';

let externalPlugins;

const resolveExternalPlugins = () => {
  if (!externalPlugins) {
    try {
      // eslint-disable-next-line
      const resolvePlugins = require('./External/index.js').default;
      if (_.isFunction(resolvePlugins)) {
        externalPlugins = resolvePlugins();
        if (!_.isArray(externalPlugins)) {
          externalPlugins = [];
        } else {
          /* TODO: validate each plugin */
          console.info(`${externalPlugins.length} external plugins loaded`);
        }
      }
    } catch (e) {
      console.error('failed to load external plugins', e);
      externalPlugins = [];
    }
  }
  return externalPlugins;
};

const resolvePlugins = () =>
  _.sortBy([...resolveStandardPlugins(), ...resolveExternalPlugins()], 'order');

export const getIntegrations = (pluginName) =>
  _.map(
    _.filter(
      resolvePlugins(),
      (plugin) => !!_.get(plugin, `integrations.${pluginName}`)
    ),
    (plugin) => plugin.integrations[pluginName]
  );

export const initializePlugins = () => {
  resolvePlugins().forEach((plugin) => plugin.onLoaded && plugin.onLoaded());
};

export default resolvePlugins;
