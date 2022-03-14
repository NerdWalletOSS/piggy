import React from 'react';
import TooltipBase from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import './Tooltip.css';

const Tooltip = ({ ...props }) => (
  <TooltipBase trigger={['hover']} mouseLeaveDelay={0.0} {...props} />
);

export default Tooltip;
