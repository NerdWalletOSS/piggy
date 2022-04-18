import React, { useEffect, useState } from 'react';
import PluginLayout from '@widgets/Plugin/PluginLayout';
import { StyleSheet, css } from 'aphrodite/no-important';

const REACT_DEVTOOLS_CONTAINER_ID = 'piggy-react-devtools-container';
const REACT_DEVTOOLS_SERVER_PORT = 8097;

const styles = StyleSheet.create({
  outerWebViewContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  innerWebViewContainer: {
    display: 'flex',
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    top: 0,
  },
  waitingContainer: {
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
  waitingText: {
    alignSelf: 'center',
    justifySelf: 'center',
  },
});

const ReactDevTools = () => {
  const [domRef, setDomRef] = useState(null);
  const port = REACT_DEVTOOLS_SERVER_PORT; /* TODO: make configurable */

  useEffect(() => {
    if (domRef) {
      const elementId = REACT_DEVTOOLS_CONTAINER_ID;
      global.ipc.reactDevTools.start(port, elementId);
    }
  }, [domRef, port]);

  return (
    <PluginLayout headerStyle={{ height: 8 }}>
      <div className={css(styles.outerWebViewContainer)}>
        <div
          className={css(styles.innerWebViewContainer)}
          id={REACT_DEVTOOLS_CONTAINER_ID}
          ref={setDomRef}
        >
          <div className={css(styles.waitingContainer)}>
            <div className={css(styles.waitingText)}>
              waiting for client connection on port {port}...
            </div>
          </div>
        </div>
      </div>
    </PluginLayout>
  );
};

export default ReactDevTools;
