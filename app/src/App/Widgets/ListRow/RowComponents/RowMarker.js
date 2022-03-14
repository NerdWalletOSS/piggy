import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'aphrodite/no-important';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as faBookmarkOutline } from '@fortawesome/free-regular-svg-icons';
import styles from '@plugins/Standard/EventLog/EventLogStyles';

const RowMarker = ({ item, marked, onClick }) => (
  <div
    onClick={(ev) => {
      if (onClick) {
        ev.stopPropagation();
        onClick(item);
      }
    }}
    className={css([
      styles.markerContainer,
      styles.marker,
      marked ? styles.markerMarked : null,
    ])}
  >
    <FontAwesomeIcon
      fixedWidth
      icon={marked ? faBookmark : faBookmarkOutline}
    />
  </div>
);

RowMarker.propTypes = {
  item: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  marked: PropTypes.bool,
};

RowMarker.defaultProps = {
  onClick: null,
  marked: false,
};

export default RowMarker;
