import React from 'react';
import { css } from 'aphrodite/no-important';
import PropTypes from 'prop-types';
import styles from './PanelStyles';

const Panel = ({
  children,
  title,
  contentStyles,
  headerStyles,
  bodyStyles,
  footerStyles,
  renderHeader,
  renderFooter,
}) => (
  <div className={css(styles.panelContent, contentStyles)}>
    <div className={css(styles.panelHeader, headerStyles)}>
      {renderHeader ? renderHeader() : title}
    </div>
    <div className={css(styles.panelBody, bodyStyles)}>{children}</div>
    {renderFooter && (
      <div className={css(styles.panelFooter, footerStyles)}>
        {renderFooter()}
      </div>
    )}
  </div>
);

Panel.propTypes = {
  children: PropTypes.object,
  title: PropTypes.string,
  contentStyles: PropTypes.object,
  headerStyles: PropTypes.object,
  bodyStyles: PropTypes.object,
  footerStyles: PropTypes.object,
  renderHeader: PropTypes.func,
  renderFooter: PropTypes.func,
};

Panel.defaultProps = {
  children: undefined,
  title: '',
  contentStyles: undefined,
  headerStyles: undefined,
  bodyStyles: undefined,
  footerStyles: undefined,
  renderHeader: undefined,
  renderFooter: undefined,
};

export default Panel;
