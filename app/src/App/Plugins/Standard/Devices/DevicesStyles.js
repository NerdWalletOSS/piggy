import { StyleSheet } from 'aphrodite/no-important';
import colors, { overlayColor, offsetColor } from '@lib/colors';
import { createColorizedRowStyle } from '@widgets/StyleGenerators';

const TRANSITION_IN = 'color .2s ease-in, background-color .2s ease-in';

const styles = StyleSheet.create({
  scrollWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflowY: 'auto',
  },
  devicesContent: {
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  devicesBlock: {
    backgroundColor: overlayColor(colors.background, 0.05),
    boxShadow: `0px 0px 8px ${colors.shadow}`,
    border: `1px solid ${colors.border}`,
    flexGrow: 0,
    borderRadius: 4,
    marginBottom: 8,
  },
  devicesBlockHeader: {
    backgroundColor: colors.titleBackground,
    color: colors.foreground,
    padding: 8,
  },
  devicesBlockFooter: {
    backgroundColor: colors.titleBackground,
    display: 'flex',
    flexDirection: 'row',
    padding: 8,
  },
  devicesBlockFooterButton: {
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
  },
  devicesBlockDisabledButton: {
    border: `1px solid ${colors.border}`,
    opacity: 0.25,
    cursor: 'not-allowed',
    ':hover': {
      backgroundColor: colors.background,
      color: colors.foreground,
    },
  },
  devicesBlockList: {
    padding: '4px 0px',
  },
  devicesBlockListRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 8px',
  },
  devicesRowIcon: {
    paddingRight: 4,
    fontSize: 18,
    color: colors.brightGreen,
  },
  devicesRowChip: {
    margin: 4,
    marginRight: 0,
    padding: '4px 8px',
    borderRadius: '4px',
    color: colors.foreground,
    backgroundColor: colors.background,
    alignSelf: 'center',
    flex: '0 1 auto',
    wordBreak: 'break-all',
    boxSizing: 'border-box',
  },
  devicesRowIconDisabled: {
    color: colors.foreground,
    opacity: 0.2,
  },
  devicesSelectableListRow: {
    cursor: 'pointer',
    borderTop: '1px solid transparent',
    borderBottom: '1px solid transparent',
    boxSizing: 'border-box',
    ':hover': {
      backgroundColor: offsetColor(colors.toolbarBackground, 0.15),
    },
  },
  devicesBlockListRowSelected: createColorizedRowStyle(colors.cyan, 'solid'),
  modalButtonContainer: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalInput: {
    flex: 1,
  },
});

export default styles;
