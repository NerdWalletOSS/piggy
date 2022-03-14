import React from 'react';
import { css } from 'aphrodite/no-important';
import PropTypes from 'prop-types';
import styles from './ToolbarStyles';

const Toolbar = ({ children, className }) => (
  <div className={css(styles.toolBarWrapper, className)}>
    <div className={css(styles.toolBar)}>{children}</div>
  </div>
);

Toolbar.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.object,
};

Toolbar.defaultProps = {
  className: undefined,
};

export default Toolbar;
