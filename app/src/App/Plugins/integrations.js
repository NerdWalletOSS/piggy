/* this is used so plugins can query integrations from other plugins without
circular dependency issues */
const getIntegrations = (pluginName) =>
  require('./index').getIntegrations(pluginName);

export default getIntegrations;
