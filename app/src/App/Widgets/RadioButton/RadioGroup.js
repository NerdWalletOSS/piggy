import _ from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { css, StyleSheet } from 'aphrodite/no-important';
import RadioButton from './RadioButton';

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  horizontal: {
    flexDirection: 'row',
  },
});

const RadioGroup = ({ options, onChange, initialIndex, horizontal }) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex || 0);
  const handleRadioButtonClick = useCallback(
    (id) => {
      const index = _.findIndex(options, (option) => option.id === id);
      if (index >= 0) {
        setSelectedIndex(index);
        onChange?.(id, index);
      }
    },
    [onChange, options, setSelectedIndex]
  );
  const children = useMemo(
    () =>
      _.map(options, (option, index) => (
        <RadioButton
          id={option.id}
          label={option.label}
          value={selectedIndex === index}
          onClick={handleRadioButtonClick}
          tabIndex="0"
        />
      )),
    [options, selectedIndex, handleRadioButtonClick]
  );
  return (
    <div className={css(styles.container, horizontal && styles.horizontal)}>
      {children}
    </div>
  );
};

RadioGroup.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  onChange: PropTypes.func,
  horizontal: PropTypes.bool,
  initialIndex: PropTypes.number,
};

RadioGroup.defaultProps = {
  options: [],
  onChange: undefined,
  horizontal: false,
  initialIndex: 0,
};

export default RadioGroup;
