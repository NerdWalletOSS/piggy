import React, { memo } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import PropTypes from 'prop-types';

const styles = StyleSheet.create({
  container: {
    cursor: 'pointer',
  },
});

const Link = memo(({ style, data, onClick, children }) => {
  const handleClick = () => onClick(data);
  return (
    <div className={css(styles.container, style)} onClick={handleClick}>
      {children}
    </div>
  );
});

Link.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  onClick: PropTypes.func,
  data: PropTypes.object,
  style: PropTypes.string,
};

Link.defaultProps = {
  children: undefined,
  onClick: undefined,
  data: undefined,
  style: undefined,
};

export default Link;
