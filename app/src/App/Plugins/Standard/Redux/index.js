import { faDatabase } from '@fortawesome/free-solid-svg-icons';
import Redux from './Redux';

export default {
  PluginComponent: Redux,
  key: 'redux',
  title: 'redux state subscriptions',
  fontAwesomeIcon: faDatabase,
  order: 2,
};
