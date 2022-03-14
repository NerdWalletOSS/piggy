import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css, StyleSheet } from 'aphrodite/no-important';
import { v4 as uuid } from 'uuid';

import colors, { offsetColor } from '@lib/colors';

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 4,
  },
  label: {
    paddingTop: 4,
    paddingBottom: 4,
    color: colors.foreground,
    margin: 8,
    marginBottom: 0,
    fontSize: '80%',
    flex: 1,
  },
  error: {
    color: offsetColor(colors.red, 0.3),
  },
});

const generateUniqueId = () => uuid().substring(0, 8);

const LabeledWidget = ({
  WidgetType,
  containerStyle,
  label,
  id,
  isValid,
  ...restProps
}) => {
  const [uniqueId] = useState(id || generateUniqueId());
  const extendedStyles = !isValid ? styles.error : undefined;
  return (
    <div className={css(styles.container, containerStyle)}>
      {label && (
        <label htmlFor={uniqueId} className={css(styles.label, extendedStyles)}>
          {label}
        </label>
      )}
      <WidgetType id={uniqueId} isValid={isValid} {...restProps} />
    </div>
  );
};

LabeledWidget.propTypes = {
  WidgetType: PropTypes.object.isRequired,
  containerStyle: PropTypes.object,
  label: PropTypes.string,
  isValid: PropTypes.bool,
  id: PropTypes.string,
};

LabeledWidget.defaultProps = {
  label: undefined,
  containerStyle: undefined,
  isValid: true,
  id: undefined,
};

export default LabeledWidget;
