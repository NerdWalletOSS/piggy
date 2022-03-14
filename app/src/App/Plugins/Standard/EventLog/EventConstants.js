import { ConsoleRow, HttpRow, NavigationRow } from '@widgets/ListRow';
import getPluginIntegrations from '@plugins/integrations';
import styles from './EventLogStyles';

const resolveConstants = (integrations, key) => {
  let rows = {};
  integrations.forEach((i) => {
    rows = {
      ...rows,
      ...i[key],
    };
  });
  return rows;
};

export const EVENT_TYPES = {
  CONSOLE: 'console',
  HTTP: 'http',
  REDUX_ACTION: 'redux/action',
  VIEW_RENDER: 'view/render',
  NAVIGATION: 'navigation',
};

export const NAVIGATION_SUBTYPE = {
  REQUEST: 'request',
  REJECTED: 'rejected',
  RESOLVED: 'resolved',
  BROADCAST: 'broadcast',
};

export const HTTP_SUBTYPE = {
  REQUEST: 'request',
  RESPONSE: 'response',
};

export const RAW_NAVIGATION_TYPES = {
  REQUEST: 'navigation/request',
  RESOLVED: 'navigation/resolve',
  REJECTED: 'navigation/reject',
  BROADCAST: 'navigation/broadcast',
};

export const RAW_HTTP_TYPES = {
  HTTP_REQUEST: 'http/request',
  HTTP_RESPONSE: 'http/response',
};

export const FILTER_TYPES = {
  NORMAL: 'normal',
  HIGHLIGHT: 'highlight',
};

export const TYPE_TO_LABEL = {
  [EVENT_TYPES.CONSOLE]: 'CONSOLE',
  [EVENT_TYPES.HTTP]: 'HTTP',
  [EVENT_TYPES.VIEW_RENDER]: 'VIEW RENDER',
  [EVENT_TYPES.NAVIGATION]: 'NAVIGATION',
};

let TYPE_TO_TITLE_PATH = {
  /* filled in dynamically after loading plugins */
};

let ITEM_TYPE_TO_RENDERER = {
  /* filled in dynamically after loading plugins */
};

export const NAVIGATION_SUBTYPE_TO_STYLE = {
  [NAVIGATION_SUBTYPE.REQUEST]: styles.navigationRequestLabel,
  [NAVIGATION_SUBTYPE.RESOLVED]: styles.navigationResolveLabel,
  [NAVIGATION_SUBTYPE.REJECTED]: styles.navigationRejectLabel,
  [NAVIGATION_SUBTYPE.BROADCAST]: styles.navigationBroadcastLabel,
};

export const loadPluginIntegrations = () => {
  const integrations = getPluginIntegrations('eventlog');
  ITEM_TYPE_TO_RENDERER = {
    [EVENT_TYPES.CONSOLE]: ConsoleRow,
    [EVENT_TYPES.HTTP]: HttpRow,
    [EVENT_TYPES.NAVIGATION]: NavigationRow,
    ...resolveConstants(integrations, 'EVENT_LIST_ROWS'),
  };
  TYPE_TO_TITLE_PATH = {
    [EVENT_TYPES.CONSOLE]: 'tag',
    [EVENT_TYPES.HTTP]: 'url',
    [EVENT_TYPES.VIEW_RENDER]: 'data.message',
    [EVENT_TYPES.NAVIGATION]: 'event',
    ...resolveConstants(integrations, 'EVENT_TYPE_TO_TITLE_PATH'),
  };
};

export const getTitlePathForItemType = (itemType) =>
  TYPE_TO_TITLE_PATH[itemType];

export const getRendererForItemType = (itemType) =>
  ITEM_TYPE_TO_RENDERER[itemType];
