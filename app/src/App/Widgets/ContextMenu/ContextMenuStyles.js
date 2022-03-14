import { StyleSheet } from 'aphrodite/no-important';
import colors, { overlayColor, offsetColor } from '@lib/colors';

const styles = StyleSheet.create({
  contextMenu: {
    position: 'absolute',
    color: colors.toolbarForeground,
    backgroundColor: colors.toolbarBackground,
    boxShadow: `0px 0px 8px #000`,
    border: `1px solid ${colors.border}`,
    zIndex: 8,
    pointerEvents: 'all',
    padding: 4,
    borderRadius: 2,
    overflowX: 'hidden',
    overflowY: 'auto',
    userSelect: 'none',
  },
  contextMenuItemEmpty: {
    padding: '8px 8px',
  },
  contextMenuItem: {
    padding: '8px 8px',
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.toolbarBackground,
    color: colors.toolbarForeground,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: offsetColor(colors.toolbarBackground, 0.15),
    },
    ':last-child': {
      borderBottom: 'none',
    },
  },
  contextMenuItemSeparator: {
    padding: 0,
  },
  contextMenuItemOn: {
    backgroundColor: overlayColor(colors.toolbarBackground, 0.05),
    color: colors.active,
  },
  contextMenuItemOff: {
    color: colors.toolbarForeground,
    backgroundColor: 'unset',
  },
  contextMenuItemDisabled: {
    color: colors.toolbarForeground,
    backgroundColor: 'unset',
    opacity: 0.66,
  },
  contextMenuItemIcon: {
    marginRight: 8,
  },
});

export default styles;

export const modalStyles = {
  modal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    background: 'transparent',
    fontSize: 12,
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'none',
    pointerEvents: 'none',
    maxWidth: 'unset',
  },
  overlay: {
    padding: 0,
    margin: 0,
    backgroundColor: '#00000077',
    overflow: 'hidden',
    zIndex: 1000000,
    display: 'flex',
    position: 'absolute',
  },
};
