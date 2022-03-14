import React from 'react';
import { css } from 'aphrodite/no-important';
import PropTypes from 'prop-types';
import styles from '@plugins/Standard/EventLog/EventLogStyles';
import { getItemLabel } from '@plugins/Standard/EventLog/utils';
import IconWithLabel from '@widgets/IconWithLabel/IconWithLabel';
import { TitleChip } from '@widgets/Chip';
import { CellBackground, RowMarker, Timestamp } from './RowComponents';
import { sharedItemPropTypes, sharedItemDefaultProps } from './SharedProps';

const ObjectRow = ({
  index,
  item,
  label,
  title,
  marked,
  selected,
  highlighted,
  markerClicked,
  rowClicked,
  chipStyle,
}) => {
  const { level, timestamp, colorHint } = item;
  label = label || getItemLabel(item);
  return [
    <CellBackground
      {...{ rowClicked, index, selected, highlighted, item, label, title }}
    />,
    <div key="content" className={css(styles.cell)}>
      <div className={css(styles.chipGroup)}>
        <IconWithLabel label={label} level={level} colorHint={colorHint} />
        <TitleChip
          item={item}
          index={index}
          chipClicked={() =>
            rowClicked({
              index,
              item,
              itemId: item.id,
              label,
              title,
            })
          }
          chipStyle={chipStyle}
          title={title}
        />
      </div>
      {timestamp && <Timestamp timestamp={timestamp} />}
      <RowMarker item={item} onClick={markerClicked} marked={marked} />
    </div>,
  ];
};

ObjectRow.propTypes = {
  ...sharedItemPropTypes,
  chipStyle: PropTypes.object,
};

ObjectRow.defaultProps = {
  ...sharedItemDefaultProps,
  chipStyle: null,
};

export default ObjectRow;
