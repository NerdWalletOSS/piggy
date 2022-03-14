import React from 'react';
import PropTypes from 'prop-types';
import LabeledWidget from '@widgets/LabeledWidget/LabeledWidget';
import Input from './Input';

const LabeledInput = ({ ...restProps }) => (
  <LabeledWidget WidgetType={Input} {...restProps} />
);

LabeledInput.propTypes = {
  label: PropTypes.string,
  isValid: PropTypes.bool,
  id: PropTypes.string,
};

LabeledInput.defaultProps = {
  label: undefined,
  isValid: true,
  id: undefined,
};

export default LabeledInput;
