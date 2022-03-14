import { StyleSheet } from 'aphrodite/no-important';
import themeColors, { offsetColor } from '@lib/colors';

const transitionIn = 'all .2s ease-in';

const defaultBackground =
  themeColors.tabBackground === themeColors.toolbarBackground
    ? offsetColor(themeColors.tabBackground, 0.05)
    : themeColors.tabBackground;

const styles = StyleSheet.create({
  toolBar: {
    border: `1px solid ${themeColors.border}`,
    borderRadius: 2,
    display: 'flex',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    backgroundColor: defaultBackground,
    boxShadow: `0px 0px 8px ${themeColors.shadow}`,
  },
  toolBarIcon: {
    color: themeColors.toolbarForeground,
    width: 32,
    paddingTop: 6,
    paddingBottom: 6,
    textAlign: 'center',
    fontSize: 12,
    transition: transitionIn,
    ':hover': {
      backgroundColor: offsetColor(defaultBackground, 0.2),
    },
  },
  toolBarClickable: {
    cursor: 'pointer',
  },
  toolBarOn: {
    color: themeColors.active,
    backgroundColor: offsetColor(defaultBackground, 0.1),
  },
  toolBarOff: {
    color: themeColors.toolbarForeground,
  },
});

export default styles;
