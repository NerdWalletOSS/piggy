import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'aphrodite/no-important';
import styles from './DefaultPluginStyles';

const PluginLayout = ({ title, children, toolbarComponents }) => (
  <div className={css(styles.pluginContainer)}>
    <div className={css(styles.pluginHeader)}>
      {title}
      <div className={css(styles.pluginHeaderSpacer)} />
      {toolbarComponents}
    </div>
    <div className={css(styles.pluginContent)}>{children}</div>
  </div>
);

PluginLayout.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  toolbarComponents: PropTypes.array,
};

PluginLayout.defaultProps = {
  toolbarComponents: [],
};

export default PluginLayout;
