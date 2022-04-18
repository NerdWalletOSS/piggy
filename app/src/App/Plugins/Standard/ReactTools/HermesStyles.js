import { StyleSheet } from 'aphrodite/no-important';
import colors from '@lib/colors';

export default StyleSheet.create({
  outerWebViewContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'none',
  },
  innerWebViewContainer: {
    display: 'none',
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    top: 0,
  },
  errorWrapper: {
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    bottom: 0,
    overflowY: 'auto',
  },
  errorContainer: {
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
  toolbarContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  toolbarDebugTargetsText: {
    marginRight: 4,
  },
  toolbarNoTargetsWarning: {
    color: colors.yellow,
    marginRight: 4,
  },
});
