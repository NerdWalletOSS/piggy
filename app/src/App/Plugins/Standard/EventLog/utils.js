import _ from 'lodash';
import { TYPE_TO_LABEL, getTitlePathForItemType } from './EventConstants';

export const sortByTimestampAndId = (a, b) => {
  if (a.timestamp === b.timestamp) {
    return a.id > b.id ? 1 : -1;
  }
  return a.timestamp > b.timestamp ? 1 : -1;
};

const tryParseJson = (str) => {
  if (_.isString(str)) {
    try {
      return JSON.parse(str);
    } catch (e) {
      /* bleh */
    }
  }
  return {
    internalError: 'specified value was not an object',
    value: str,
  };
};

export const parseHttpDataAsJson = (eventLogItem) => {
  ['body', 'data'].forEach((key) => {
    const currentValue = _.get(eventLogItem, `data.parameters.${key}`);
    if (currentValue) {
      _.set(eventLogItem, `data.parameters.${key}`, tryParseJson(currentValue));
    }
  });
};

export const formatItemType = (type) => {
  if (type.indexOf('http/') === 0 || type.indexOf('navigation/') === 0) {
    return type.split('/')[0];
  }
  return type;
};

export const debouncedUpdate = _.debounce((value, updateValue) => {
  updateValue(value);
}, 500);

export const formatDefaultItemLabel = (type) =>
  type && type.split('/').join(' ').toUpperCase();

export const getItemLabel = (item) =>
  TYPE_TO_LABEL[item.type] || formatDefaultItemLabel(item.type) || 'UNKNOWN';

export const getItemTitle = (item) =>
  _.get(item, getTitlePathForItemType(item.type) || 'title') ||
  _.get(item, 'data.type') /* todo: remove me */ ||
  item.tag ||
  '<unknown>';
