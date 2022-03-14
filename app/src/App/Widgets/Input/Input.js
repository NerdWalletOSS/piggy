import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { css, StyleSheet } from 'aphrodite/no-important';
import colors, { offsetColor } from '@lib/colors';

const createStyleSheet = (accentColor) =>
  StyleSheet.create({
    input: {
      padding: '0.5rem',
      border: `1px solid ${accentColor}`,
      backgroundColor: offsetColor(colors.background, 0.05),
      color: colors.foreground,
      ':focus': {
        outline: 'none',
        backgroundColor: offsetColor(colors.background, 0.3),
        border: `1px dashed ${colors.yellow}`,
      },
      ':hover': {
        backgroundColor: offsetColor(colors.background, 0.5),
      },
      '::selection': {
        backgroundColor: colors.foreground,
        color: offsetColor(colors.background, 0.05),
      },
    },
    inputInvalid: {
      border: `1px solid ${colors.red}`,
      ':focus': {
        border: `1px solid ${offsetColor(colors.red, 0.3)}`,
      },
      ':hover': {
        border: `1px solid ${offsetColor(colors.red, 0.3)}`,
      },
    },
  });

const Input = ({
  placeholder,
  onChange,
  onSubmit,
  accentColor,
  autoFocus,
  value,
  style,
  isValid,
  id,
}) => {
  const inputRef = useRef(null);
  const styles = useMemo(() => createStyleSheet(accentColor), [accentColor]);
  const extendedStyles = isValid ? undefined : styles.inputInvalid;

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus, inputRef]);

  const handleChange = useCallback(
    (e) => {
      if (onChange) {
        onChange(e.target.value, e);
      }
    },
    [onChange]
  );

  const handleKeyPress = useCallback(
    ({ key }) => {
      if (key === 'Enter') {
        onSubmit?.();
      }
    },
    [onSubmit]
  );

  return (
    <input
      id={id}
      ref={inputRef}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
      placeholder={placeholder || 'search'}
      className={css(styles.input, style, extendedStyles)}
      value={value}
    />
  );
};

Input.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  style: PropTypes.object,
  autoFocus: PropTypes.bool,
  isValid: PropTypes.bool,
  accentColor: PropTypes.string,
  id: PropTypes.string,
};

Input.defaultProps = {
  placeholder: '',
  value: '',
  autoFocus: false,
  onSubmit: undefined,
  style: undefined,
  isValid: true,
  accentColor: colors.background,
  id: undefined,
};

export default Input;
