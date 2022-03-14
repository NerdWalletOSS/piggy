import _ from 'lodash';
import { EVENT_TYPES } from './EventConstants';

const contains = (input, filter) => {
  if (_.isArray(input)) {
    return _.find(
      input,
      (arg) => JSON.stringify(arg).toLocaleLowerCase().indexOf(filter) >= 0
    );
  }
  if (_.isPlainObject(input)) {
    return _.find(
      [...Object.keys(input), ...Object.values(input)],
      (arg) => JSON.stringify(arg).toLocaleLowerCase().indexOf(filter) >= 0
    );
  }
  return false;
};

export default (item, filter, deep) => {
  /* note there's some redundant code sprinkled throughout this function;
  searching is potentially very expensive, so we prefer performance over
  DRY in this case. for example, we could run contains() once, but it's
  heavy weight, so we only run it after the quick portions of the operation
  have finished */
  if (!filter || filter.length === 0) {
    return true;
  }
  filter = filter.toLocaleLowerCase(); // eslint-disable-line
  if (item.level && item.level.toLocaleLowerCase().startsWith(filter)) {
    return true;
  }
  switch (item.type) {
    case EVENT_TYPES.CONSOLE: {
      return (
        'console'.indexOf(filter) >= 0 ||
        contains([item.tag, item.data], filter)
      );
    }
    case EVENT_TYPES.HTTP:
      return (
        'http'.indexOf(filter) >= 0 ||
        (item.url && item.url.toLocaleLowerCase().indexOf(filter) >= 0) ||
        (deep && contains(item.data, filter))
      );
    case EVENT_TYPES.REDUX_ACTION:
      return (
        'redux'.indexOf(filter) >= 0 ||
        (item.data.type &&
          item.data.type.toLocaleLowerCase().indexOf(filter) >= 0) ||
        (deep && contains(item.data, filter))
      );
    case EVENT_TYPES.VIEW_RENDER:
      return (
        'view/render'.indexOf(filter) >= 0 ||
        (item.data.message &&
          item.data.message.toLocaleLowerCase().indexOf(filter) >= 0) ||
        (deep && contains(item.data, filter))
      );
    case EVENT_TYPES.NAVIGATION:
      return (
        'navigation'.indexOf(filter) >= 0 ||
        (item.event && item.event.toLocaleLowerCase().indexOf(filter) >= 0) ||
        (deep && contains(item.data, filter))
      );
    default:
      return (
        (item.type && item.type.toLocaleLowerCase().indexOf(filter) >= 0) ||
        (item.title && item.title.toLocaleLowerCase().indexOf(filter) >= 0) ||
        (item.tag && item.tag.toLocaleLowerCase().indexOf(filter) >= 0) ||
        (deep && contains(item.data, filter))
      );
  }
};
