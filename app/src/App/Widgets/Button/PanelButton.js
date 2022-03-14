import React, { useMemo } from 'react';
import { StyleSheet } from 'aphrodite/no-important';
import PropTypes from 'prop-types';
import Button, { BUTTON_THEME } from './Button';

const styles = StyleSheet.create({
  button: {
    marginLeft: 8,
    marginBottom: 8,
  },
});

const PanelButton = ({ children, style, ...props }) => {
  const mergedStyles = useMemo(
    () => ({
      ...styles.button,
      ...(style || {}),
    }),
    [style]
  );
  return (
    <Button theme={BUTTON_THEME.PLUGIN_CONTENT} style={mergedStyles} {...props}>
      {children}
    </Button>
  );
};

PanelButton.propTypes = {
  children: PropTypes.object,
  style: PropTypes.object,
};

PanelButton.defaultProps = {
  children: null,
  style: null,
};

export default PanelButton;
