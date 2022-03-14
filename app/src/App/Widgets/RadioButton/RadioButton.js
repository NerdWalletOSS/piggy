import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { css, StyleSheet } from 'aphrodite/no-important';
import colors, { offsetColor } from '@lib/colors';

const noop = () => {};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'row',
    padding: 8,
    border: '1px solid transparent',
    ':focus': {
      outline: 'none',
      border: `1px dashed ${colors.yellow}`,
    },
    '::selection': {
      backgroundColor: colors.foreground,
      color: offsetColor(colors.background, 0.05),
    },
    ':hover': {
      backgroundColor: offsetColor(colors.background, 0.5),
    },
  },
  radioButton: {
    display: 'flex',
    alignSelf: 'center',
    width: 14,
    height: 14,
    borderRadius: 7,
    boxSizing: 'border-box',
  },
  radioButtonOn: {
    border: `1px solid ${colors.blue}`,
    width: '100%',
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderRadius: 7,
    ':hover': {
      backgroundColor: offsetColor(colors.blue, 0.3),
    },
  },
  radioButtonOff: {
    width: '100%',
    borderRadius: 7,
    border: `2px solid ${colors.blue}`,
    ':hover': {
      border: `2px solid ${offsetColor(colors.blue, 0.3)}`,
    },
  },
  label: {
    alignSelf: 'center',
    marginLeft: 8,
  },
});

const RadioButton = ({ onClick, label, id, value }) => {
  const handleClick = useCallback(
    (e) => {
      onClick?.(id, value, e);
    },
    [onClick, id, value]
  );

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <div
      tabIndex={0}
      onKeyPress={handleKeyPress}
      onClick={handleClick}
      className={css(styles.container)}
    >
      <div className={css(styles.radioButton)}>
        <div
          className={css(value ? styles.radioButtonOn : styles.radioButtonOff)}
        />
      </div>
      <div className={css(styles.label)}>{label}</div>
    </div>
  );
};

RadioButton.propTypes = {
  label: PropTypes.string,
  id: PropTypes.string.isRequired,
  value: PropTypes.bool,
  onClick: PropTypes.func,
};

RadioButton.defaultProps = {
  label: '',
  value: false,
  onClick: noop,
};

export default RadioButton;
