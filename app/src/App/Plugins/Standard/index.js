import Devices from '@plugins/Standard/Devices';
import EventLog from '@plugins/Standard/EventLog';
import HermesDebugger from '@plugins/Standard/HermesDebugger';
import Timeline from '@plugins/Standard/Timeline';
import Redux from '@plugins/Standard/Redux';

const STANDARD_PLUGINS = [Devices, EventLog, HermesDebugger, Redux, Timeline];

export default () => STANDARD_PLUGINS;
