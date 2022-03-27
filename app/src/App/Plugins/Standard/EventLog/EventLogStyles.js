import { StyleSheet } from 'aphrodite/no-important';
import colors, {
  backgroundify,
  overlayColor,
  offsetColor,
  makeLightColor,
} from '@lib/colors';
import { createColorizedRowStyle } from '@widgets/StyleGenerators';

const LIGHT_CHIP_BACKGROUND = offsetColor(colors.background, 0.1);

const styles = StyleSheet.create({
  EventLog: {
    height: '100%',
    margin: 0,
    padding: 0,
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
    color: colors.foreground,
  },
  emptyContainer: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  wrapper: {
    color: colors.foreground,
    fontFamily: 'Arial',
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    bottom: 0,
    overflowY: 'auto',
  },
  cellWrapper: {
    position: 'relative',
    padding: '2px 0',
  },
  cell: {
    position: 'relative',
    backgroundColor: overlayColor(colors.background, 0.05),
    boxSizing: 'border-box',
    alignItems: 'center',
    display: 'flex',
    cursor: 'pointer',
    pointerEvents: 'none',
  },
  cellBackground: {
    position: 'absolute',
    boxSizing: 'border-box',
    borderTop: `1px solid ${colors.border}`,
    borderBottom: `1px solid ${colors.border}`,
    left: 0,
    right: 0,
    top: 2,
    bottom: 2,
    cursor: 'pointer',
    pointerEvents: 'all',
    ':hover': {
      backgroundColor: overlayColor(colors.background, 0.1),
    },
  },
  errorCell: createColorizedRowStyle(colors.brightRed),
  warningCell: createColorizedRowStyle(colors.brightYellow),
  debugCell: {},
  selectedCell: createColorizedRowStyle(colors.cyan, 'solid'),
  highlightedCell: {
    ...createColorizedRowStyle('yellow', 'solid'),
    borderWidth: 3,
  },
  mainContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignContent: 'stretch',
    alignItems: 'stretch',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  toolbarComponent: {
    marginRight: 6,
  },
  searchInput: {
    border: `1px solid ${colors.border}`,
    borderRadius: 2,
    boxShadow: `0px 0px 8px ${colors.shadow}`,
    backgroundColor: offsetColor(colors.background, 0.05),
    color: colors.foreground,
    paddingLeft: 8,
    width: 224,
    height: 24 /* hack */,
    ':focus': {
      outline: 'none',
      backgroundColor: offsetColor(colors.background, 0.3),
      border: `1px solid ${offsetColor(colors.border, 0.3)}`,
    },
    ':hover': {
      border: `1px solid ${offsetColor(colors.border, 0.3)}`,
    },
    '::selection': {
      backgroundColor: colors.foreground,
      color: offsetColor(colors.background, 0.05),
    },
  },
  list: {
    order: 2,
    flex: '1 1 auto',
    alignSelf: 'auto',
    overflowX: 'hidden',
  },
  timestamp: {
    paddingLeft: 8,
    paddingRight: 4,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 10,
    opacity: 0.6,
  },
  row: {
    display: 'flex',
    cursor: 'pointer',
    flex: 1,
    marginLeft: 4,
    marginRight: 4,
  },
  labelAndTitleRow: {
    display: 'flex',
    flex: '1 1 auto',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '8px',
    boxSizing: 'border-box',
    maxWidth: '100%',
    minWidth: 0 /* hack to force truncation on long titles */,
  },
  markerContainer: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 6,
  },
  marker: {
    width: 12,
    height: 12,
    pointerEvents: 'all',
    opacity: 0.5,
    ':hover': {
      color: colors.foreground,
      opacity: 1.0,
    },
  },
  markerMarked: {
    color: colors.green,
    opacity: 1.0,
    ':hover': {
      color: colors.green,
      opacity: 1.0,
    },
  },
  urlModalUrl: {
    color: colors.foreground,
    fontSize: 12,
    wordBreak: 'break-all',
  },
  urlModalButtons: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  label: {
    flex: '0 0 auto',
    padding: '4px 12px',
    marginTop: 4,
    marginBottom: 4,
    borderRadius: '4px',
    color: colors.foreground,
    alignSelf: 'center',
  },
  tag: {
    flex: '0 0 auto',
    padding: '4px 12px',
    marginTop: 4,
    marginBottom: 4,
    marginLeft: 8,
    borderRadius: '4px',
    background: colors.background,
    color: colors.foreground,
    alignSelf: 'center',
  },
  eventIcon: {
    marginLeft: 8,
    marginRight: 12,
    fontSize: 15,
    cursor: 'pointer' /* hack */,
  },
  info: {
    color: offsetColor(colors.foreground, 0.1),
    opacity: 0.25,
  },
  warn: {
    color: colors.brightYellow,
  },
  debug: {
    color: colors.brightGreen,
  },
  error: {
    color: colors.brightRed,
  },
  navigationTag: {
    backgroundColor: colors.background,
    color: colors.yellow,
  },
  navigationEventLabel: {
    backgroundColor: colors.background,
    color: colors.yellow,
  },
  navigationRequestLabel: {
    backgroundColor: colors.background,
    color: colors.foreground,
  },
  navigationResolveLabel: {
    backgroundColor: colors.background,
    color: colors.green,
  },
  navigationRejectLabel: {
    backgroundColor: colors.background,
    color: colors.red,
  },
  navigationBroadcastLabel: {
    backgroundColor: colors.background,
    color: colors.foreground,
  },
  chipWrapper: {
    borderLeft: '8px solid transparent',
    borderTop: '4px solid transparent',
    borderBottom: '4px solid transparent',
  },
  clickableChipWrapper: {
    pointerEvents: 'all',
  },
  chip: {
    padding: '4px 12px',
    borderRadius: '4px',
    color: colors.foreground,
    border: `1px solid transparent`,
    backgroundColor: colors.background,
    pointerEvents: 'none',
    alignSelf: 'center',
    flex: '0 1 auto',
    wordBreak: 'break-all',
    boxSizing: 'border-box',
  },
  clickableChip: {
    boxShadow: `0 0 4px ${colors.shadow}`,
    border: `1px solid ${colors.cyan}`,
    pointerEvents: 'all',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: colors.foreground,
      color: colors.background,
    },
  },
  chipGroup: {
    display: 'flex',
    flex: 1,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  consoleTag: {
    backgroundColor: colors.background,
    color: colors.magenta,
  },
  arrayTextLabel: {
    backgroundColor: LIGHT_CHIP_BACKGROUND,
    color: colors.foreground,
  },
  arrayObjectLabel: {},
  arrayBoolTrueLabel: {
    backgroundColor: LIGHT_CHIP_BACKGROUND,
    color: colors.green,
  },
  arrayBoolFalseLabel: {
    backgroundColor: LIGHT_CHIP_BACKGROUND,
    color: colors.red,
  },
  arrayNumberLabel: {
    backgroundColor: LIGHT_CHIP_BACKGROUND,
    color: colors.yellow,
  },
  httpDefaultLabel: {
    backgroundColor: colors.background,
    color: colors.foreground,
  },
  httpLink: {
    backgroundColor: LIGHT_CHIP_BACKGROUND,
    color: offsetColor(colors.blue, 0.25),
    textDecoration: 'underline',
    boxShadow: 'none',
    marginLeft: 0,
    marginRight: 0,
    paddingLeft: 4,
    paddingRight: 4,
    border: `1px solid transparent`,
  },
  httpMethod: {
    border: '1px solid transparent',
    backgroundColor: colors.background,
    color: colors.blue,
  },
  httpOkLabel: {
    backgroundColor: colors.background,
    color: colors.green,
  },
  httpWarningLabel: {
    backgroundColor: colors.background,
    color: colors.yellow,
  },
  httpErrorLabel: {
    backgroundColor: colors.background,
    color: colors.red,
  },
  httpStatus: {
    backgroundColor: offsetColor(colors.background, 0.1),
  },
  httpLabel: {
    backgroundColor: backgroundify(colors.blue),
  },
  navigationLabel: {
    backgroundColor: backgroundify(colors.yellow),
  },
  consoleLabel: {
    backgroundColor: backgroundify(colors.magenta),
  },
  reduxLabel: {
    backgroundColor: backgroundify(colors.green),
  },
  warningLabel: {
    backgroundColor: backgroundify(colors.yellow),
  },
  successLabel: {
    backgroundColor: backgroundify(colors.green),
  },
  errorLabel: {
    backgroundColor: backgroundify(colors.red),
  },
  queryLabel: {
    backgroundColor: backgroundify(colors.green),
  },
  mutationLabel: {
    background: backgroundify(colors.magenta),
  },
  queryLink: {
    color: makeLightColor(colors.green),
    backgroundColor: LIGHT_CHIP_BACKGROUND,
    boxShadow: 'none',
    marginLeft: 0,
    marginRight: 0,
    paddingLeft: 4,
    paddingRight: 4,
    border: `1px solid transparent`,
  },
  mutationLink: {
    color: makeLightColor(colors.magenta),
    backgroundColor: LIGHT_CHIP_BACKGROUND,
    boxShadow: 'none',
    marginLeft: 0,
    marginRight: 0,
    paddingLeft: 4,
    paddingRight: 4,
    border: `1px solid transparent`,
  },
  queryMethod: {
    border: '1px solid transparent',
    backgroundColor: colors.background,
    color: colors.green,
  },
  mutationMethod: {
    border: '1px solid transparent',
    backgroundColor: colors.background,
    color: colors.magenta,
  },
});

const createGenericStyles = (colorString) => ({
  [`${colorString}Label`]: {
    backgroundColor: backgroundify(colors[colorString]),
  },
  [`${colorString}Tag`]: {
    backgroundColor: colors.background,
    color: colors[colorString],
  },
});

const genericItemStyles = StyleSheet.create({
  ...createGenericStyles('white'),
  ...createGenericStyles('blue'),
  ...createGenericStyles('green'),
  ...createGenericStyles('yellow'),
  ...createGenericStyles('cyan'),
  ...createGenericStyles('magenta'),
  ...createGenericStyles('red'),
});

export const getGenericLabelStyle = (colorHint, fallbackStyle) => [
  styles.label,
  genericItemStyles[`${colorHint}Label`] ||
    fallbackStyle ||
    genericItemStyles.whiteLabel,
];

export const getGenericTagStyle = (colorHint, fallbackStyle) =>
  genericItemStyles[`${colorHint}Tag`] ||
  fallbackStyle ||
  genericItemStyles.whiteTag;

export default styles;
