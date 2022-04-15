import { faBug } from '@fortawesome/free-solid-svg-icons';
import ReactDevTools from './ReactDevTools';

export default {
  PluginComponent: ReactDevTools,
  key: 'reactdevtools',
  title: 'react dev tools',
  fontAwesomeIcon: faBug,
  order: 99,
};
