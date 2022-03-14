import { faBug } from '@fortawesome/free-solid-svg-icons';
import HermesDebugger from './HermesDebugger';

export default {
  PluginComponent: HermesDebugger,
  key: 'hermesdebugger',
  title: 'hermes debugger',
  fontAwesomeIcon: faBug,
  order: 99,
};
