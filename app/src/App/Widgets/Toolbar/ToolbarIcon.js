import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { css } from 'aphrodite/no-important';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Tooltip from '../Tooltip/Tooltip';
import styles from './ToolbarStyles';

class ToolbarIcon extends PureComponent {
  render() {
    const {
      IconComponent,
      fontAwesomeIcon,
      tooltip,
      onClick,
      isOn,
      alwaysVisible,
      ...restProps
    } = this.props;
    let onStyle = styles.toolBarOn;
    if (!alwaysVisible) {
      onStyle = isOn ? styles.toolBarOn : styles.toolBarOff;
    }

    return (
      <Tooltip placement="bottom" overlay={tooltip}>
        <div
          className={css(
            styles.toolBarIcon,
            onClick ? styles.toolBarClickable : null,
            onStyle
          )}
          onClick={onClick}
          {...restProps}
        >
          {fontAwesomeIcon ? (
            <FontAwesomeIcon fixedWidth icon={fontAwesomeIcon} />
          ) : (
            IconComponent
          )}
        </div>
      </Tooltip>
    );
  }
}

ToolbarIcon.propTypes = {
  IconComponent: PropTypes.object,
  fontAwesomeIcon: PropTypes.object,
  tooltip: PropTypes.element,
  onClick: PropTypes.func,
  isOn: PropTypes.bool,
  alwaysVisible: PropTypes.bool,
};

ToolbarIcon.defaultProps = {
  IconComponent: undefined,
  tooltip: '<span></span>',
  fontAwesomeIcon: undefined,
  onClick: () => {},
  isOn: false,
  alwaysVisible: false,
};

export default ToolbarIcon;
