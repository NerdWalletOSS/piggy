import { StyleSheet } from 'aphrodite/no-important';
import colors, { offsetColor } from '@lib/colors';

export const defaultModalStyles = {
  modal: {
    minWidth: '40vw',
    maxWidth: '80vw',
    color: colors.foreground,
    backgroundColor: offsetColor(colors.background, 0.1),
    fontSize: 12,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: `0 0 32px #000`,
    border: `2px solid ${colors.border}`,
    borderRadius: 4,
    userSelect: 'none',
  },
  overlay: {
    padding: 0,
    backgroundColor: '#00000099',
    overflow: 'hidden',
    zIndex: 1000000,
  },
};

export const styles = StyleSheet.create({
  modalTitle: {
    color: colors.foreground,
    fontSize: 14,
    margin: 0,
    alignSelf: 'center',
    flex: '1 0 auto',
  },
  titleRow: {
    display: 'flex',
    flexDirection: 'row',
    paddingBottom: '16px',
    background: offsetColor(colors.background, -0.2),
    padding: '6px 8px',
    margin: 0,
  },
  contents: {
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
  },
  titleButton: {
    fontSize: 14,
    display: 'flex',
    alignSelf: 'center',
    color: colors.red,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    minWidth: 20,
    minHeight: 20,
    ':hover': {
      background: offsetColor(colors.background, 0.1),
    },
  },
});
