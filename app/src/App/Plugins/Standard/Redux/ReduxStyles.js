import { StyleSheet } from 'aphrodite/no-important';
import colors, { overlayColor } from '@lib/colors';

export default StyleSheet.create({
  container: {
    display: 'block',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflowY: 'auto',
  },
  subscriptionContainer: {
    flex: '0 0',
    position: 'relative',
    backgroundColor: overlayColor(colors.background, 0.05),
    boxShadow: `0px 0px 8px ${colors.shadow}`,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    margin: 8,
    ':hover': {
      backgroundColor: overlayColor(colors.background, 0.075),
    },
  },
  subscriptionInput: {
    flex: 1,
  },
  addSubscriptionModalButtons: {
    display: 'flex',
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  removeSubscription: {
    color: colors.brightRed,
  },
  subscriptionContainerButtons: {
    marginLeft: 12,
  },
  titleText: {
    flex: 1,
  },
  titleRow: {
    fontSize: 14,
    backgroundColor: colors.titleBackground,
    color: colors.title,
    display: 'flex',
    padding: 8,
    marginBottom: 8,
  },
  emptyWrapper: {
    display: 'flex',
    flex: '1 1 auto',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
