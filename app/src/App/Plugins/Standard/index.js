import Devices from '@plugins/Standard/Devices';
import EventLog from '@plugins/Standard/EventLog';
import ReactTools from '@plugins/Standard/ReactTools';
import Timeline from '@plugins/Standard/Timeline';
import Redux from '@plugins/Standard/Redux';

const STANDARD_PLUGINS = [Devices, EventLog, ReactTools, Redux, Timeline];

export default () => STANDARD_PLUGINS;
