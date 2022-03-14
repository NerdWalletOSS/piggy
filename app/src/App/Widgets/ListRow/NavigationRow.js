import React from 'react';
import { css } from 'aphrodite/no-important';
import styles from '@plugins/Standard/EventLog/EventLogStyles';
import { NAVIGATION_SUBTYPE } from '@plugins/Standard/EventLog/EventConstants';
import { getItemLabel } from '@plugins/Standard/EventLog/utils';
import IconWithLabel from '@widgets/IconWithLabel/IconWithLabel';
import { NavigationChip } from '@widgets/Chip';
import { CellBackground, RowMarker, Timestamp } from './RowComponents';
import { sharedItemPropTypes, sharedItemDefaultProps } from './SharedProps';

const NavigationRow = ({
  index,
  item,
  marked,
  selected,
  highlighted,
  chipClicked,
  rowClicked,
  markerClicked,
}) => {
  const SUBTYPE = NAVIGATION_SUBTYPE;
  const { level, event, timestamp } = item;
  const label = getItemLabel(item);
  const title = event;
  const chips = [];

  /* second: event name */
  chips.push(NavigationChip(item, index, 'event', chipClicked));

  /* first: request/broadcast */
  if (item.data[SUBTYPE.REQUEST]) {
    chips.push(NavigationChip(item, index, SUBTYPE.REQUEST, chipClicked));
  }
  if (item.data[SUBTYPE.BROADCAST]) {
    chips.push(NavigationChip(item, index, SUBTYPE.BROADCAST, chipClicked));
  }

  /* third resolved/rejected */
  if (item.data[SUBTYPE.RESOLVED]) {
    chips.push(NavigationChip(item, index, SUBTYPE.RESOLVED, chipClicked));
  } else if (item.data[SUBTYPE.REJECTED]) {
    chips.push(NavigationChip(item, index, SUBTYPE.REJECTED, chipClicked));
  }

  return [
    <CellBackground
      {...{ rowClicked, index, selected, highlighted, item, label, title }}
    />,
    <div
      key="content"
      className={css(styles.cell)}
      onClick={() => rowClicked({ index, item, itemId: item.id, label, title })}
    >
      <div className={css(styles.chipGroup)}>
        <IconWithLabel
          label={label}
          level={level}
          tagStyles={[styles.navigationTag]}
        />
        {chips}
      </div>
      {timestamp && <Timestamp timestamp={timestamp} />}
      <RowMarker item={item} onClick={markerClicked} marked={marked} />
    </div>,
  ];
};

NavigationRow.propTypes = {
  ...sharedItemPropTypes,
};

NavigationRow.defaultProps = {
  ...sharedItemDefaultProps,
};

export default NavigationRow;
