import { StyleSheet } from 'aphrodite/no-important';
import colors, { offsetColor, overlayColor } from '@lib/colors';

const transitionIn = 'color .2s ease-in, background-color .2s ease-in';

const titlebarBackground = offsetColor(colors.tabBackground, -0.3);
const toolbarBackground = offsetColor(colors.tabBackground, -0.2);

const logoSize = 24;
const titleBarHeight = 24;
const pluginHeaderHeight = 38;
const pluginToolbarWidth = 48;
const titleBarFontSize = 12;
const titleBarIconFontSize = 10;
const defaultFontSize = 12;
const defaultIconFontSize = 14;

const createTitleBarButtonStyle = (color) => ({
  backgroundColor: color,
  ':hover': {
    backgroundColor: offsetColor(color, 0.15),
  },
  ':active': {
    backgroundColor: offsetColor(color, -0.15),
  },
});

export default StyleSheet.create({
  AppChrome: {
    display: 'flex',
    flex: '1 0 auto',
    flexDirection: 'column',
    fontSize: defaultFontSize,
    overflow: 'hidden',
    userSelect: 'none',
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  titleBar: {
    padding: 0,
    margin: 0,
    fontSize: titleBarFontSize,
    backgroundColor: titlebarBackground,
    height: titleBarHeight,
    color: colors.toolbarForeground,
    '-webkit-app-region': 'drag',
    flexDirection: 'row',
    display: 'flex',
    flex: '0 0 auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBarText: {
    padding: 0,
    margin: 0,
    marginRight: 8,
    fontSize: 12,
    opacity: 0.66,
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBarIcons: {
    padding: 0,
    margin: 0,
    marginLeft: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '-webkit-app-region': 'none',
  },
  titleBarIcon: {
    marginRight: 8,
    fontSize: titleBarIconFontSize,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  titleBarClientIcons: {
    padding: 0,
    margin: 0,
    marginRight: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBarClientIcon: {
    marginLeft: 2,
    fontSize: titleBarIconFontSize,
    color: colors.active,
  },
  titleBarClose: createTitleBarButtonStyle(colors.red),
  titleBarMinimize: createTitleBarButtonStyle(colors.yellow),
  titleBarMaximize: createTitleBarButtonStyle(colors.green),
  mainHorizontalStack: {
    backgroundColor: colors.background,
    color: colors.foreground,
    flex: '1 0 auto',
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  pluginMenu: {
    display: 'flex',
    flexDirection: 'column',
    width: pluginToolbarWidth,
    backgroundColor: toolbarBackground,
  },
  pluginIcon: {
    boxSizing: 'border-box',
    padding: '8px 0',
    width: pluginToolbarWidth,
    listStyle: 'none',
    fontSize: defaultIconFontSize,
    textAlign: 'center',
    cursor: 'pointer',
    transition: transitionIn,
    ':hover': {
      backgroundColor: overlayColor(colors.background, 0.05),
    },
  },
  pluginIconActive: {
    backgroundColor: colors.background,
    color: colors.active,
  },
  logoContainer: {
    width: pluginToolbarWidth,
    height: pluginHeaderHeight,
    display: 'flex',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: overlayColor(colors.background, 0.05),
    },
  },
  logoImage: {
    width: logoSize,
    height: logoSize,
  },
  menuSpacer: {
    flex: '1 0 auto',
  },
  serverPausedIcon: {
    color: colors.green,
  },
  serverResumedIcon: {
    color: colors.red,
  },
  updateCheckModalButtons: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 16,
  },
});
