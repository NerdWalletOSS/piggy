import _ from 'lodash';
import {
  createStateSubscription,
  overrideStateSubscriptionPaths,
} from '@nerdwallet/epic-state-subscriptions';
import timeline, { TIMELINE_PRIORITY } from './timeline';
import eventLog from './eventlog';
import webSocket from './websocket';
import {
  IS_AVAILABLE,
  WEBSOCKET_MESSAGE_TYPE,
  EVENT_TYPE,
  EVENT_LEVEL,
  COLOR_HINT,
} from './constants';

let colorHint = COLOR_HINT.GREEN;

const STATE_SUBSCRIPTION_KEY = 'piggy';
const STOPWATCH_NAME = 'Redux Actions';

let lazyRx;

const processStateSubscription = (store) => (paths) => {
  store.dispatch(
    overrideStateSubscriptionPaths({
      key: STATE_SUBSCRIPTION_KEY,
      paths,
    })
  );
};

const patchDispatch = (
  dispatch,
  filterDispatchedAction = (...args) => [...args]
) => {
  if (IS_AVAILABLE) {
    if (!dispatch.patched) {
      const stopwatch = timeline.stopwatch(
        STOPWATCH_NAME,
        TIMELINE_PRIORITY.REDUX,
        {
          colorHint,
        }
      );

      const patchedDispatch = function patchedDispatch(...args) {
        const action = args[0] || {};
        const type = action.actionName || action.type || '<unknown>';
        const work = stopwatch.start(type);
        const result = dispatch(...args);
        work.stop();
        let filtered = filterDispatchedAction(...args);
        filtered =
          !_.isArray(filtered) || !filtered.length ? [...args] : filtered;
        const data = filtered.length === 1 ? filtered[0] : filtered;
        eventLog.send({
          type: EVENT_TYPE.REDUX_ACTION,
          level: EVENT_LEVEL.INFO,
          title: type,
          colorHint: COLOR_HINT.GREEN,
          data,
        });
        return result;
      };

      patchedDispatch.patched = true;
      return patchedDispatch;
    }
  }
  return dispatch;
};

const initialize = (store, filterReduxAction, colorHintOverride) => {
  colorHint = colorHintOverride || colorHint;
  store.dispatch = patchDispatch(store.dispatch, filterReduxAction);
  webSocket.messageEmitter.addListener(
    WEBSOCKET_MESSAGE_TYPE.SET_STATE_SUBSCRIPTION_PATHS,
    processStateSubscription(store)
  );
};

const createEpic = () => (action$, state$) => {
  if (!lazyRx) {
    /* note this is very unfortunate, but benchmarking shows importing
    these operators is a very expensive operation (~200ms), and was
    tanking unit test times. let's just look these up lazily and cache
    'em locally */
    const { bufferTime, filter, map } = require('rxjs/operators');
    lazyRx = { bufferTime, filter, map };
  }
  return action$.pipe(
    lazyRx.bufferTime(250),
    lazyRx.filter((actions) => actions.length > 0),
    createStateSubscription(state$, {
      key: STATE_SUBSCRIPTION_KEY,
    }),
    lazyRx.map((paths) => {
      const changeSet = paths.reduce(
        (acc, { path, pathPattern }) => ({
          ...acc,
          [pathPattern]: {
            ...acc[pathPattern],
            [path]: _.get(state$.value, path),
          },
        }),
        {}
      );
      webSocket.sendMessage(
        WEBSOCKET_MESSAGE_TYPE.UPDATE_STATE_SUBSCRIPTIONS,
        changeSet
      );
      return {
        type: `Piggy${WEBSOCKET_MESSAGE_TYPE.UPDATE_STATE_SUBSCRIPTIONS}`,
        payload: changeSet,
      };
    })
  );
};

export default { initialize, createEpic };
