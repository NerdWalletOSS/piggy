import { faTerminal } from '@fortawesome/free-solid-svg-icons';
import EventLog from './EventLog';
import { loadPluginIntegrations } from './EventConstants';

export default {
  PluginComponent: EventLog,
  key: 'eventlog',
  title: 'event log',
  fontAwesomeIcon: faTerminal,
  order: 0,
  onLoaded: () => {
    loadPluginIntegrations();
  },
};
