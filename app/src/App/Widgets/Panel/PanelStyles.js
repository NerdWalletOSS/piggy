import { StyleSheet } from 'aphrodite/no-important';
import colors, { overlayColor, offsetColor } from '@lib/colors';
import { createColorizedRowStyle } from '@widgets/StyleGenerators';

const styles = StyleSheet.create({
  panelContent: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: overlayColor(colors.background, 0.05),
    boxShadow: `0px 0px 8px ${colors.shadow}`,
    border: `1px solid ${colors.border}`,
    flexGrow: 0,
    borderRadius: 4,
  },
  panelBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  panelHeader: {
    backgroundColor: colors.titleBackground,
    color: colors.foreground,
    padding: 8,
  },
  panelFooter: {
    backgroundColor: colors.titleBackground,
    display: 'flex',
    flexDirection: 'row',
    padding: 8,
  },
  panelListRowHeader: {
    fontSize: '115%',
    backgroundColor: colors.background,
    padding: 8,
  },
  panelListRow: {
    cursor: 'pointer',
    borderTop: '1px solid transparent',
    borderBottom: '1px solid transparent',
    boxSizing: 'border-box',
    ':hover': {
      backgroundColor: offsetColor(colors.toolbarBackground, 0.15),
    },
    padding: 8,
  },
  panelListRowSelected: createColorizedRowStyle(colors.cyan, 'solid'),
});

export default styles;
