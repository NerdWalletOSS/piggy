import Devices from '@plugins/Standard/Devices';
import EventLog from '@plugins/Standard/EventLog';
import HermesDebugger from '@plugins/Standard/HermesDebugger';
import Timeline from '@plugins/Standard/Timeline';
import Redux from '@plugins/Standard/Redux';
import ReactDevTools from '@plugins/Standard/ReactDevTools';

const STANDARD_PLUGINS = [
  Devices,
  EventLog,
  HermesDebugger,
  ReactDevTools,
  Redux,
  Timeline,
];

export default () => STANDARD_PLUGINS;
