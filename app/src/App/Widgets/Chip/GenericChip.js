import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'aphrodite/no-important';
import styles from '@plugins/Standard/EventLog/EventLogStyles';
import ChipWrapper from './ChipWrapper';

const GenericChip = ({ item, caption, chipStyle, key, chipClicked }) => {
  const onClick =
    chipClicked &&
    ((ev) => {
      ev.stopPropagation();
      chipClicked({
        item,
        caption,
        key,
      });
    });
  return (
    <ChipWrapper clickable={!!onClick} key={key}>
      <div
        className={css([
          styles.chip,
          onClick && styles.clickableChip,
          chipStyle,
        ])}
        onClick={onClick}
      >
        {caption}
      </div>
    </ChipWrapper>
  );
};

GenericChip.propTypes = {
  item: PropTypes.object.isRequired,
  caption: PropTypes.string.isRequired,
  chipStyle: PropTypes.object,
  key: PropTypes.string.isRequired,
  chipClicked: PropTypes.func,
};

GenericChip.defaultProps = {
  chipClicked: undefined,
  chipStyle: undefined,
};

export default GenericChip;
