import timeline, { TIMELINE_PRIORITY } from './timeline';
import { FEATURE } from './constants';

const SET_TIMEOUT_STOPWATCH_NAME = 'setTimeout';

function monkeyPatchComponentUpdates() {
  const stopwatch = timeline.stopwatch(
    SET_TIMEOUT_STOPWATCH_NAME,
    TIMELINE_PRIORITY.SET_TIMEOUT
  );
  const originalSetTimeout = setTimeout;
  /* eslint-disable-next-line */
  setTimeout = function (fn, timeout) {
    let callable = fn;
    if (callable && timeout > 1) {
      const work = stopwatch.start('setTimeout');
      callable = () => {
        fn();
        work.stop();
      };
    }
    return originalSetTimeout(callable, timeout);
  };
}

const setConfiguration = (config) => {
  if (config.features[FEATURE.SET_TIMEOUT]) {
    monkeyPatchComponentUpdates();
  }
};

export default { setConfiguration };
