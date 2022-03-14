import React, { useState } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import PropTypes from 'prop-types';
import colors, { offsetColor } from '@lib/colors';

const styles = StyleSheet.create({
  selectContainer: {
    padding: '.5em',
    border: `1px solid ${colors.background}`,
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
});

const Dropdown = ({ items, enabled, onChange, defaultSelected }) => {
  const [selected, setSelected] = useState(defaultSelected);
  const options = items.map((item, i) => (
    <option value={item.name || item} selected={selected === i}>
      {item.name || item}
    </option>
  ));

  const handleChange = (e) => {
    setSelected(e.target.selectedIndex);
    onChange?.(e.target.selectedIndex);
  };

  return (
    <select
      disabled={!enabled}
      onChange={handleChange}
      className={css(styles.selectContainer)}
    >
      {options}
    </select>
  );
};

Dropdown.propTypes = {
  items: PropTypes.oneOf(PropTypes.object, PropTypes.array),
  onChange: PropTypes.func.isRequired,
  enabled: PropTypes.bool,
  defaultSelected: PropTypes.number,
};

Dropdown.defaultProps = {
  items: [],
  enabled: true,
  defaultSelected: 0,
};

export default Dropdown;
