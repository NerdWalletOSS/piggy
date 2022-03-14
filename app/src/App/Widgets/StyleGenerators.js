import { makeTransparent } from '@lib/colors';

export const createColorizedRowStyle = (color, type = 'dashed') => ({
  borderTop: `1px ${type} ${color}`,
  borderBottom: `1px ${type} ${color}`,
  backgroundColor: makeTransparent(color, 0.1),
  ':hover': {
    backgroundColor: makeTransparent(color, 0.2),
  },
});
