import _ from 'lodash';
import React, { useCallback } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import PropTypes from 'prop-types';
import colors, { foregroundify, backgroundify } from '@lib/colors';

const TRANSITION_IN = 'color .2s ease-in, background-color .2s ease-in';

export const BUTTON_THEME = {
  DIALOG: 'DIALOG',
  PLUGIN_CONTENT: 'PLUGIN_CONTENT',
};

export const BUTTON_TYPE = {
  CANCEL: 'CANCEL',
  CONFIRM: 'CONFIRM',
};

const styles = (
  theme = BUTTON_THEME.DIALOG,
  type = BUTTON_TYPE.CONFIRM,
  enabled = true
) => {
  switch (theme) {
    case BUTTON_THEME.PLUGIN_CONTENT: {
      const buttonStyle = {
        container: {
          outline: 'none',
          marginRight: 8,
          padding: '4px 12px',
          backgroundColor: colors.background,
          color: colors.foreground,
          boxShadow: `0 0 4px ${colors.shadow}`,
          border: `1px solid ${colors.cyan}`,
          borderRadius: '4px',
          boxSizing: 'border-box',
          cursor: 'pointer',
          transition: TRANSITION_IN,
          ':hover': {
            backgroundColor: colors.foreground,
            color: colors.background,
          },
          ':focus': {
            border: `1px dashed ${colors.yellow}`,
          },
        },
      };
      if (!enabled) {
        _.merge(buttonStyle.container, {
          border: `1px solid ${colors.border}`,
          opacity: 0.25,
          cursor: 'not-allowed',
          ':hover': {
            backgroundColor: colors.background,
            color: colors.foreground,
          },
        });
      }
      return StyleSheet.create(buttonStyle);
    }
    case BUTTON_THEME.DIALOG:
    default:
      return StyleSheet.create({
        container: {
          border: `2px solid ${backgroundify(
            type === BUTTON_TYPE.CONFIRM ? colors.green : colors.red
          )}`,
          padding: '8px',
          minWidth: '30px',
          textAlign: 'center',
          color: colors.foreground,
          transition: 'background, .2s',
          cursor: 'pointer',
          borderRadius: '2px',
          alignSelf: 'flex-start',
          width: 'max-content',
          background: `${backgroundify(
            type === BUTTON_TYPE.CONFIRM ? colors.green : colors.red
          )}`,
          ':not(:last-child)': {
            marginRight: 4,
          },
          ':hover': {
            color: colors.background,
            background: foregroundify(
              `${
                type === BUTTON_TYPE.CONFIRM
                  ? colors.brightGreen
                  : colors.brightRed
              }`
            ),
          },
        },
      });
  }
};

const Button = ({ children, enabled, onClick, type, theme, style }) => {
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onClick && onClick();
      }
    },
    [onClick]
  );

  return (
    <div
      tabIndex={0}
      onKeyPress={handleKeyPress}
      onClick={() => enabled && onClick && onClick()}
      className={css(styles(theme, type, enabled).container, style)}
    >
      {children}
    </div>
  );
};

Button.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  onClick: PropTypes.func,
  type: PropTypes.string,
  theme: PropTypes.string,
  style: PropTypes.object,
  enabled: PropTypes.bool,
};

Button.defaultProps = {
  children: undefined,
  onClick: undefined,
  type: undefined,
  theme: undefined,
  style: undefined,
  enabled: true,
};

export default Button;
