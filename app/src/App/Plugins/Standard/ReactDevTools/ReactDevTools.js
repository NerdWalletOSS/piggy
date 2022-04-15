import React, { useEffect } from 'react';
import PluginLayout from '@widgets/Plugin/PluginLayout';
import { StyleSheet, css } from 'aphrodite/no-important';

/* sample implementation: https://github.com/jhen0409/react-native-debugger/blob/master/app/containers/ReactInspector.js */

const REACT_DEVTOOLS_CONTAINER_ID = 'piggy-react-devtools-container';
const REACT_DEVTOOLS_SERVER_PORT = 8097;

const styles = StyleSheet.create({
  outerWebViewContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  innerWebViewContainer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    top: 0,
  },
  errorWrapper: {
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    bottom: 0,
    overflowY: 'auto',
  },
  errorContainer: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});

const ReactDevTools = () => {
  useEffect(() => {
    /* TODO: don't sleep, just wait for the DOM to be loaded. should be able to
    do this by observing the ref? */
    setTimeout(() => {
      const port = REACT_DEVTOOLS_SERVER_PORT; /* TODO: make configurable */
      const elementId = REACT_DEVTOOLS_CONTAINER_ID;
      /* the UI shouldn't be responsible for this, it should be started by
      the BackendContext, perhaps. even better: figure out a way for plugins
      to specify their own preload scripts */
      global.ipc.reactDevTools.start(port, elementId);
    }, 2500);
    /* TODO: close server on unmount? */
  }, []);

  return (
    <PluginLayout title="react dev tools">
      <div className={css(styles.outerWebViewContainer)}>
        <div
          className={css(styles.innerWebViewContainer)}
          id={REACT_DEVTOOLS_CONTAINER_ID}
        >
          loading...
        </div>
      </div>
    </PluginLayout>
  );
};

export default ReactDevTools;
