import { StyleSheet } from 'aphrodite/no-important';
import colors, { offsetColor } from '@lib/colors';

const toolbarBackground = offsetColor(colors.tabBackground, -0.2);

const pluginHeaderHeight = 38;
const defaultIconFontSize = 14;

export default StyleSheet.create({
  pluginContainer: {
    backgroundColor: colors.background,
    color: colors.foreground,
    display: 'flex',
    flex: '1 1',
    flexDirection: 'column',
  },
  pluginContent: {
    backgroundColor: colors.background,
    boxShadow: `inset 0 0 8px ${colors.shadow}`,
    color: colors.foreground,
    flex: 1,
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  pluginHeader: {
    padding: 0,
    paddingLeft: 8,
    paddingRight: 5,
    margin: 0,
    fontSize: defaultIconFontSize,
    display: 'flex',
    backgroundColor: toolbarBackground,
    height: pluginHeaderHeight,
    alignItems: 'center',
  },
  pluginHeaderSpacer: {
    flex: '1 1 auto',
  },
});
