import React from 'react';
import { css } from 'aphrodite/no-important';
import styles from '@plugins/Standard/EventLog/EventLogStyles';
import { sharedItemPropTypes, sharedItemDefaultProps } from '../SharedProps';

const LEVEL_TO_CELL_BACKGROUND = {
  error: styles.errorCell,
  warn: styles.warningCell,
  debug: styles.debugCell,
};

const CellBackground = ({
  index,
  selected,
  highlighted,
  rowClicked,
  item,
  label,
  title,
}) => (
  <div
    key="background"
    className={css([
      styles.cellBackground,
      !selected && LEVEL_TO_CELL_BACKGROUND[item.level],
      highlighted && styles.highlightedCell,
      selected && styles.selectedCell,
    ])}
    onClick={() => rowClicked({ index, item, itemId: item.id, label, title })}
  />
);

CellBackground.propTypes = {
  ...sharedItemPropTypes,
};

CellBackground.defaultProps = {
  ...sharedItemDefaultProps,
};

export default CellBackground;
