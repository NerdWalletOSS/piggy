import { StyleSheet } from 'aphrodite/no-important';
import colors, { offsetColor } from '@lib/colors';

const styles = StyleSheet.create({
  successToast: {
    backgroundColor: offsetColor(colors.background, 0.2),
    color: colors.foreground,
    border: `2px solid ${colors.brightGreen}`,
    borderRadius: 4,
    boxShadow: `0 0 4px ${colors.shadow}`,
    minHeight: 'unset',
  },
  errorToast: {
    backgroundColor: offsetColor(colors.background, 0.2),
    color: colors.foreground,
    border: `2px solid ${colors.brightRed}`,
    borderRadius: 4,
    boxShadow: `0 0 4px ${colors.shadow}`,
    minHeight: 'unset',
  },
});

export default styles;
