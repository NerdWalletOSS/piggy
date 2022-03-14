import _ from 'lodash';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StyleSheet, css } from 'aphrodite/no-important';
import {
  faBug,
  faInfoCircle,
  faExclamationTriangle,
  faSkull,
} from '@fortawesome/free-solid-svg-icons';
import styles, {
  getGenericLabelStyle,
} from '@plugins/Standard/EventLog/EventLogStyles';

const internalStyles = StyleSheet.create({
  labelWithIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  labelIcon: {
    opacity: 1.0,
    marginLeft: 0,
    marginRight: 0,
  },
  labelIconMargin: {
    marginRight: 12,
  },
});

const DEFAULT_MESSAGE_TYPE = styles.info;
const LEVEL_TO_MESSAGE_TYPE = {
  log: styles.info,
  info: styles.info,
  warn: styles.warn,
  debug: styles.debug,
  error: styles.error,
};

const DEFAULT_LOG_ICON = faInfoCircle;
const LEVEL_TO_LOG_ICON = {
  log: faInfoCircle,
  info: faInfoCircle,
  warn: faExclamationTriangle,
  debug: faBug,
  error: faSkull,
};

const LABEL_NAME_TO_STYLE = {
  CONSOLE: [styles.label, styles.consoleLabel],
  HTTP: [styles.label, styles.httpLabel],
  NAVIGATION: [styles.label, styles.navigationLabel],
  QUERY: [styles.label, styles.queryLabel],
  MUTATION: [styles.label, styles.mutationLabel],
};

const getLabelStyle = (label, colorHint) =>
  css(
    getGenericLabelStyle(colorHint, LABEL_NAME_TO_STYLE[label]),
    internalStyles.labelWithIcon
  );

const getEventIconStyle = (level, ...additionalStyles) =>
  css(
    [styles.eventIcon, LEVEL_TO_MESSAGE_TYPE[level] || DEFAULT_MESSAGE_TYPE],
    ...additionalStyles
  );

const IconWithLabel = ({
  label,
  labelIcon,
  level,
  tag,
  colorHint,
  tagStyles = [],
}) =>
  _.compact([
    level ? (
      <div key="icon" className={getEventIconStyle(level)}>
        <FontAwesomeIcon icon={LEVEL_TO_LOG_ICON[level] || DEFAULT_LOG_ICON} />
      </div>
    ) : (
      <div key="spacer" style={{ width: 8 }} />
    ),
    <div key="label" className={getLabelStyle(label, colorHint)}>
      {labelIcon && (
        <div
          key="icon"
          className={getEventIconStyle(
            level,
            internalStyles.labelIcon,
            label && internalStyles.labelIconMargin
          )}
        >
          <FontAwesomeIcon icon={labelIcon} />
        </div>
      )}
      {label}
    </div>,
    tag && (
      <div key="sublabel" className={css([styles.tag, ...tagStyles])}>
        {tag}
      </div>
    ),
  ]);

export default IconWithLabel;
