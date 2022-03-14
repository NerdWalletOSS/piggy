import React from 'react';
import PropTypes from 'prop-types';
import BaseModal from 'react-responsive-modal';
import { css } from 'aphrodite/no-important';
import _ from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { styles, defaultModalStyles } from './ModalStyles';

export const TitleButton = ({ icon, onClick }) => (
  <div className={css(styles.titleButton)} onClick={onClick}>
    <FontAwesomeIcon icon={icon || faTimes} />
  </div>
);

TitleButton.propTypes = {
  icon: PropTypes.object,
  onClick: PropTypes.func,
};

TitleButton.defaultProps = {
  icon: null,
  onClick: null,
};

const Modal = ({ title, children, styleOverrides, onClose, ...restProps }) => (
  <BaseModal
    showCloseIcon={false}
    {...restProps}
    onClose={onClose}
    styles={_.merge(defaultModalStyles, styleOverrides)}
  >
    <div className={css(styles.titleRow)}>
      <div className={css(styles.modalTitle)}>{title}</div>
      <TitleButton onClick={onClose} />
    </div>
    <div className={css(styles.contents)}>{children}</div>
  </BaseModal>
);

Modal.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  title: PropTypes.string,
  onClose: PropTypes.func,
  styleOverrides: PropTypes.object,
};

Modal.defaultProps = {
  children: undefined,
  title: '',
  onClose: null,
  styleOverrides: {},
};

export default Modal;
