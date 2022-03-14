import React from 'react';
import { css } from 'aphrodite/no-important';
import PropTypes from 'prop-types';
import _ from 'lodash';
import styles from '@plugins/Standard/EventLog/EventLogStyles';
import { getItemLabel } from '@plugins/Standard/EventLog/utils';
import IconWithLabel from '@widgets/IconWithLabel/IconWithLabel';
import { ArrayChip } from '@widgets/Chip';
import { CellBackground, RowMarker, Timestamp } from './RowComponents';
import { sharedItemPropTypes, sharedItemDefaultProps } from './SharedProps';

const ArrayRow = ({
  index,
  item,
  marked,
  selected,
  highlighted,
  rowClicked,
  chipClicked,
  markerClicked,
  tagStyles,
}) => {
  const { level, tag, timestamp } = item;
  const label = getItemLabel(item);
  const title = tag;
  const args = (_.isArray(item.data) ? item.data : item.data.arguments) || [];
  const chips = _.map(args, (el, chipIndex) =>
    ArrayChip(item, el, index, chipIndex, chipClicked)
  );
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
          tag={tag}
          colorHint={item.colorHint}
          tagStyles={tagStyles}
        />
        {chips}
      </div>
      {timestamp && <Timestamp timestamp={timestamp} />}
      <RowMarker item={item} onClick={markerClicked} marked={marked} />
    </div>,
  ];
};

ArrayRow.propTypes = {
  ...sharedItemPropTypes,
  tagStyles: PropTypes.array,
};

ArrayRow.defaultProps = {
  ...sharedItemDefaultProps,
};

export default ArrayRow;
