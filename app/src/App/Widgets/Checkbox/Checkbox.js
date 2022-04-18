import React, { useCallback, useState } from 'react';
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
  checkbox: {
    display: 'flex',
    alignSelf: 'center',
    width: 12,
    height: 12,
    boxSizing: 'border-box',
  },
  checkboxTrue: {
    display: 'flex',
    flex: 1,
    border: `1px solid ${colors.green}`,
    ':hover': {
      border: colors.green,
    },
  },
  innerTrue: {
    backgroundColor: offsetColor(colors.green, -0.3),
    margin: 2,
    flex: 1,
  },
  checkboxFalse: {
    display: 'flex',
    flex: 1,
    border: `1px solid ${colors.red}`,
    ':hover': {
      border: `1px solid ${offsetColor(colors.red, 0.3)}`,
    },
  },
  label: {
    alignSelf: 'center',
    marginLeft: 8,
  },
});

const Checkbox = ({ label, value, onChange, style }) => {
  const [internalValue, setInternalValue] = useState(value);

  const handleToggle = useCallback(
    (e) => {
      setInternalValue(!internalValue);
      onChange?.(!internalValue, e);
    },
    [internalValue, setInternalValue, onChange]
  );

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleToggle();
      }
    },
    [handleToggle]
  );

  return (
    <div
      tabIndex={0}
      onKeyPress={handleKeyPress}
      onClick={handleToggle}
      className={css(styles.container)}
      style={style}
    >
      <div className={css(styles.checkbox)}>
        <div
          className={css(value ? styles.checkboxTrue : styles.checkboxFalse)}
        >
          <div className={css(value ? styles.innerTrue : undefined)} />
        </div>
      </div>
      <div className={css(styles.label)}>{label}</div>
    </div>
  );
};

Checkbox.propTypes = {
  label: PropTypes.string,
  value: PropTypes.bool,
  onChange: PropTypes.func,
  style: PropTypes.object,
};

Checkbox.defaultProps = {
  label: '',
  value: false,
  onChange: noop,
  style: null,
};

export default Checkbox;
