import _ from 'lodash';
import { StyleSheet } from 'aphrodite/no-important';
import colors, {
  backgroundify,
  offsetColor,
  foregroundify,
  overlayColor,
  makeTransparent,
} from '@lib/colors';

const barHeight = 20;

const timescaleBackground =
  colors.tabBackground === colors.toolbarBackground
    ? offsetColor(colors.tabBackground, -0.15)
    : colors.tabBackground;

const styles = StyleSheet.create({
  emptyContainer: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventAndScaleContainer: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  wrapper: {
    color: colors.foreground,
    outline: 'none',
    fontFamily: 'Arial',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    bottom: 0,
    margin: 0,
    overflow: 'hidden',
  },
  bar: {
    display: 'flex',
    alignItems: 'center',
    height: barHeight,
    backgroundColor: backgroundify(colors.blue),
    boxSizing: 'border-box',
    border: '1px solid transparent',
    color: colors.foreground,
    overflow: 'visible',
    fontSize: 10,
    marginTop: 4,
    marginBottom: 4,
    position: 'relative',
    userSelect: 'text',
    pointerEvents: 'all',
  },
  barGroup: {
    minHeight: barHeight,
  },
  barTitle: {
    position: 'absolute',
    width: 'auto',
    whiteSpace: 'nowrap',
    paddingLeft: 5,
    userSelect: 'text',
  },
  timelineWindow: {
    backgroundColor: colors.background,
    color: colors.foreground,
    width: '100%',
    flex: 1,
    bottom: 0,
    userSelect: 'none',
    overflowY: 'auto',
    overflowX: 'hidden',
    '::-webkit-scrollbar': {
      display: 'none',
    },
  },
  track: {
    position: 'relative',
    padding: '6px 0px',
    pointerEvents: 'none',
  },
  gridLine: {
    position: 'absolute',
    bottom: 0,
    top: 0,
    borderLeft: `1px solid ${colors.gridLine}`,
  },
  lastEventLine: {
    marginLeft: 2,
    borderLeft: `3px solid ${colors.error}`,
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  idleMarker: {
    backgroundColor: makeTransparent(colors.cyan, 0.1),
    boxSizing: 'border-box',
    borderLeft: `1px dashed ${colors.cyan}`,
    borderRight: `1px dashed ${colors.cyan}`,
    marginLeft: 1,
    marginRight: 1,
    opacity: 0.75,
    position: 'absolute',
    top: 0,
    bottom: 0,
    ':hover': {
      backgroundColor: makeTransparent(colors.cyan, 0.75),
    },
  },
  timescale: {
    position: 'relative',
    bottom: 0,
    width: '100%',
    borderTop: `1px solid ${colors.border}`,
    height: 28,
    backgroundColor: timescaleBackground,
    color: colors.foreground,
    userSelect: 'none',
  },
  timescaleCell: {
    position: 'absolute',
    bottom: 0,
    top: 0,
    borderLeft: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
  },
  groupTitle: {
    padding: 4,
    fontSize: 12,
    backgroundColor: colors.titleBackground,
    pointerEvents: 'all',
    cursor: 'pointer',
    color: colors.title,
    ':hover': {
      backgroundColor: overlayColor(colors.background, 0.15),
    },
  },
  groupTitleText: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupTitlePriority: {
    marginRight: 12,
    fontSize: '75%',
  },
});

const createActiveBarStyle = (color) => ({
  backgroundColor: backgroundify(color),
  ':hover': {
    border: `1px solid ${colors.foreground}`,
    boxShadow: `0px 0px 8px ${colors.shadow}`,
    zIndex: 9999,
  },
});

const createIdleBarStyle = (color) =>
  _.merge({}, createActiveBarStyle(color), {
    border: `1px solid ${color}`,
    backgroundColor: makeTransparent(color, 0.25),
  });

const extendedStyles = StyleSheet.create({
  whiteTitle: { color: foregroundify(colors.white) },
  whiteBarActive: createActiveBarStyle(colors.white),
  whiteBarIdle: createIdleBarStyle(colors.white),
  blueTitle: { color: foregroundify(colors.blue) },
  blueBarActive: createActiveBarStyle(colors.blue),
  blueBarIdle: createIdleBarStyle(colors.blue),
  greenTitle: { color: foregroundify(colors.green) },
  greenBarActive: createActiveBarStyle(colors.green),
  greenBarIdle: createIdleBarStyle(colors.green),
  yellowTitle: { color: foregroundify(colors.yellow) },
  yellowBarActive: createActiveBarStyle(colors.yellow),
  yellowBarIdle: createIdleBarStyle(colors.yellow),
  cyanTitle: { color: foregroundify(colors.cyan) },
  cyanBarActive: createActiveBarStyle(colors.cyan),
  cyanBarIdle: createIdleBarStyle(colors.cyan),
  magentaTitle: { color: foregroundify(colors.magenta) },
  magentaBarActive: createActiveBarStyle(colors.magenta),
  magentaBarIdle: createIdleBarStyle(colors.magenta),
  redTitle: { color: foregroundify(colors.red) },
  redBarActive: createActiveBarStyle(colors.red),
  redBarIdle: createIdleBarStyle(colors.red),
});

const colorHintToBar = {
  white: extendedStyles.whiteBarActive,
  'white-idle': extendedStyles.whiteBarIdle,
  blue: extendedStyles.blueBarActive,
  'blue-idle': extendedStyles.blueBarIdle,
  green: extendedStyles.greenBarActive,
  'green-idle': extendedStyles.greenBarIdle,
  yellow: extendedStyles.yellowBarActive,
  'yellow-idle': extendedStyles.yellowBarIdle,
  cyan: extendedStyles.cyanBarActive,
  'cyan-idle': extendedStyles.cyanBarIdle,
  magenta: extendedStyles.magentaBarActive,
  'magenta-idle': extendedStyles.magentaBarIdle,
  red: extendedStyles.redBarActive,
  'red-idle': extendedStyles.redBarIdle,
};

const colorHintToTitle = {
  white: extendedStyles.whiteTitle,
  blue: extendedStyles.blueTitle,
  green: extendedStyles.greenTitle,
  yellow: extendedStyles.yellowTitle,
  cyan: extendedStyles.cyanTitle,
  magenta: extendedStyles.magentaTitle,
  red: extendedStyles.redTitle,
};

export const getBarStyle = (name, type, colorHint) => {
  const idle = type === 'idle';
  colorHint = idle ? `${colorHint}-idle` : colorHint;
  if (colorHintToBar[colorHint]) {
    return colorHintToBar[colorHint];
  }
  return idle ? extendedStyles.whiteBarIdle : extendedStyles.whiteBarActive;
};

export const getTitleStyle = (name, colorHint) =>
  colorHintToTitle[colorHint] || extendedStyles.whiteTitle;

export default styles;
