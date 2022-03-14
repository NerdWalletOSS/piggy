import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { ArrayRow, ObjectRow } from '@widgets/ListRow';
import {
  sharedItemPropTypes,
  sharedItemDefaultProps,
} from '@widgets/ListRow/SharedProps';
import { css } from 'aphrodite/no-important';
import styles from '@plugins/Standard/EventLog/EventLogStyles';
import { getRendererForItemType } from './EventConstants';

const EventLogItem = ({
  forwardedRef,
  rowClicked,
  chipClicked,
  markerClicked,
  urlClicked,
  markedItems,
  highlightedItems,
  selectedItemId,
  style,
  data,
  index,
}) => {
  const item = data[index];
  const marked = markedItems.has(item.id);
  const highlighted = highlightedItems.has(item.id);
  const selected = selectedItemId === item.id;
  const props = {
    item,
    marked,
    highlighted,
    selected,
    rowClicked,
    chipClicked,
    markerClicked,
    urlClicked,
  };

  /* special note: we first check to see if there's a renderer for the item's
  subtype, as it's more specific. if one doesn't exist, we'll try to find
  a renderer for the item type itself. if we still can't find anything, we'll
  use an Array or Object renderer, depending on the item type. */
  let ItemType =
    getRendererForItemType(item.subtype) || getRendererForItemType(item.type);
  if (!ItemType) {
    ItemType = _.isArray(item.data) ? ArrayRow : ObjectRow;
  }
  return (
    <div
      ref={forwardedRef}
      style={style}
      className={css(styles.cellWrapper)}
      key={`${item.id}.wrapper`}
    >
      <ItemType key={`${item.id}.inner`} index={index} {...props} />
    </div>
  );
};

EventLogItem.propTypes = {
  ...sharedItemPropTypes,
  forwardedRef: PropTypes.func,
  style: PropTypes.object,
  data: PropTypes.array.isRequired,
};

EventLogItem.defaultProps = {
  ...sharedItemDefaultProps,
  style: undefined,
  forwardedRef: undefined,
};

export default EventLogItem;
