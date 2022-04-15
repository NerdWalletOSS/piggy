import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'aphrodite/no-important';
import styles from './DefaultPluginStyles';

const PluginLayout = ({
  title,
  children,
  headerStyle,
  contentStyle,
  toolbarComponents,
}) => (
  <div className={css(styles.pluginContainer)}>
    <div className={css(styles.pluginHeader)} style={headerStyle}>
      {title}
      <div className={css(styles.pluginHeaderSpacer)} />
      {toolbarComponents}
    </div>
    <div className={css(styles.pluginContent)} style={contentStyle}>
      {children}
    </div>
  </div>
);

PluginLayout.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  toolbarComponents: PropTypes.array,
  headerStyle: PropTypes.any,
  contentStyle: PropTypes.any,
};

PluginLayout.defaultProps = {
  toolbarComponents: [],
  headerStyle: null,
  contentStyle: null,
};

export default PluginLayout;
