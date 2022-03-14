import _ from 'lodash';
import React from 'react';
import { css } from 'aphrodite/no-important';
import styles from '@plugins/Standard/EventLog/EventLogStyles';
import {
  EVENT_TYPES,
  NAVIGATION_SUBTYPE_TO_STYLE,
  TYPE_TO_LABEL,
} from '@plugins/Standard/EventLog/EventConstants';
import ChipWrapper from './ChipWrapper';

const NavigationChip = (item, index, key, chipClicked) => {
  let chipTypeStyle;
  let caption = '';
  let chipPath;
  if (key === 'event') {
    caption = item.event || 'unknown';
    chipTypeStyle = styles.navigationEventLabel;
  } else {
    chipTypeStyle =
      NAVIGATION_SUBTYPE_TO_STYLE[key] || styles.navigationRequestLabel;
    chipPath = `data.${key}`;
    caption = key;
    if (!_.get(item, chipPath)) {
      console.error('getNavigationChip', 'null data for item!', item);
      return null;
    }
  }

  const onClick =
    chipPath &&
    chipClicked &&
    ((ev) => {
      ev.stopPropagation();
      chipClicked({
        item,
        itemId: item.id,
        index,
        title: `data for '${key}'`,
        label: TYPE_TO_LABEL[EVENT_TYPES.NAVIGATION],
        timestamp: item.timestamp,
        displayName: key,
        chipPath,
      });
    });
  return (
    <ChipWrapper clickable={!!onClick} key={key}>
      <div
        className={css([
          styles.chip,
          onClick && styles.clickableChip,
          chipTypeStyle,
        ])}
        onClick={onClick}
      >
        {caption}
      </div>
    </ChipWrapper>
  );
};

export default NavigationChip;
