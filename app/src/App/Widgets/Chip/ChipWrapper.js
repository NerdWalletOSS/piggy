import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'aphrodite/no-important';
import styles from '@plugins/Standard/EventLog/EventLogStyles';

//
// ChipWrapper -- we use a wrapper div instead of margins
// as a hack to avoid flickering while the user is mousing from
// chip to chip.
//

const ChipWrapper = ({ children, clickable, key }) => (
  <div
    className={css(
      styles.chipWrapper,
      clickable ? styles.clickableChipWrapper : undefined
    )}
    key={key}
  >
    {children}
  </div>
);

ChipWrapper.propTypes = {
  children: PropTypes.object.isRequired,
  clickable: PropTypes.bool,
  key: PropTypes.string.isRequired,
};

ChipWrapper.defaultProps = {
  clickable: false,
};

export default ChipWrapper;
