import _ from 'lodash';
import { css } from 'aphrodite/no-important';
import PropTypes from 'prop-types';
import React from 'react';
import BaseModal from 'react-responsive-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles, { modalStyles } from './ContextMenuStyles';

const DropDownList = ({
  items,
  emptyLabel,
  onDismiss,
  overlayStyle,
  modalStyle,
  listStyle,
  onItemClicked,
}) => {
  let rows = _.compact(
    _.map(items, (item, index) => {
      const isSeparator = item.disabled && item.label === '-';
      const label = isSeparator ? '' : item.label;
      const classes = _.compact([
        styles.contextMenuItem,
        item.off ? styles.contextMenuItemOff : styles.contextMenuItemOn,
        item.disabled && styles.contextMenuItemDisabled,
        isSeparator && styles.contextMenuItemSeparator,
      ]);
      return (
        <div
          className={css(classes)}
          key={`${index}-${item.label}`}
          onClick={() => onItemClicked && onItemClicked(item, index)}
        >
          {item.icon && (
            <FontAwesomeIcon
              className={css(styles.contextMenuItemIcon)}
              fixedWidth
              icon={item.icon}
            />
          )}
          {label}
        </div>
      );
    })
  );

  if (_.isEmpty(rows)) {
    rows = [
      <div
        key="0-nothing-to-see-here"
        className={css([styles.contextMenuItemEmpty])}
      >
        {emptyLabel}
      </div>,
    ];
  }

  const updatedModalStyles = _.merge({}, modalStyles, {
    overlay: overlayStyle,
    modal: modalStyle,
  });

  return (
    <BaseModal
      open
      showCloseIcon={false}
      styles={updatedModalStyles}
      onClose={onDismiss}
    >
      <div className={css(styles.contextMenu)} style={listStyle}>
        {rows}
      </div>
    </BaseModal>
  );
};

DropDownList.propTypes = {
  items: PropTypes.array.isRequired,
  overlayStyle: PropTypes.object,
  modalStyle: PropTypes.object,
  listStyle: PropTypes.object,
  emptyLabel: PropTypes.string,
  onItemClicked: PropTypes.func,
  onDismiss: PropTypes.func,
};

DropDownList.defaultProps = {
  emptyLabel: 'empty list!',
  overlayStyle: {},
  modalStyle: {},
  listStyle: {},
  onItemClicked: undefined,
  onDismiss: () => {},
};

export default DropDownList;
