import { toast } from 'react-toastify';
import { css } from 'aphrodite/no-important';
import styles from './ToastStyles';

const DEFAULT_PROPS = {
  hideProgressBar: true,
  closeButton: false,
  autoClose: 3500,
};

export default {
  success: (message) => {
    toast(message, {
      ...DEFAULT_PROPS,
      className: css(styles.successToast),
    });
  },

  error: (message) => {
    toast(message, {
      ...DEFAULT_PROPS,
      className: css(styles.errorToast),
    });
  },
};
