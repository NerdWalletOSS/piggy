import React from 'react';
import { css } from 'aphrodite/no-important';
import PropTypes from 'prop-types';
import moment from 'moment';
import styles from '@plugins/Standard/EventLog/EventLogStyles';

const Timestamp = ({ timestamp }) => (
  <div className={css(styles.timestamp)}>
    {`[${moment(timestamp).format('hh:mm:ss:SSS')}]`}
  </div>
);

Timestamp.propTypes = {
  timestamp: PropTypes.number.isRequired,
};

export default Timestamp;
