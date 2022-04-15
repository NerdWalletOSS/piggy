import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import fetch from 'node-fetch';
import { css } from 'aphrodite/no-important';
import Dropdown from '@widgets/Dropdown/Dropdown';
import PluginLayout from '@widgets/Plugin/PluginLayout';
import ChromeDevTools from './ChromeDevTools';
import HermesStyles from './HermesStyles';

const HERMES_DEBUGGER_CONTAINER_ID = 'hermes-debugger-container';
const POLL_INTERVAL_MS = 2 * 1000;
const METRO_PORT = '8081';
const METRO_HOST = 'http://localhost';

const findAvailableDebugTargets = async (clientState, setClientState) => {
  let updatedClientState;

  try {
    const metroUrl = new URL(METRO_HOST);
    metroUrl.port = METRO_PORT;
    const response = await fetch(`${metroUrl.toString()}json`);
    const result = await response.json();

    /* not sure why, but we only support "Chrome Reload" targets */
    const targets = result.filter(
      (target) =>
        target.title === 'React Native Experimental (Improved Chrome Reloads)'
    );

    /* find the last selected target in the list of results. if it's not
    available, we'll choose the first target (if available) just below... */
    let currentlySelected = null;
    if (clientState.selectedTarget != null) {
      for (let i = 0; i < result.length; i++) {
        const target = result[i];
        if (
          clientState.selectedTarget?.webSocketDebuggerUrl ===
          target.webSocketDebuggerUrl
        ) {
          currentlySelected = clientState.selectedTarget;
        }
      }
    }

    /* no current target? select the first one */
    const selectedTarget =
      currentlySelected == null && targets.length === 1
        ? targets[0]
        : currentlySelected;

    updatedClientState = { error: null, targets, selectedTarget };
  } catch (error) {
    updatedClientState = { error, targets: null, selectedTarget: null };
  }

  if (!_.isEqual(clientState, updatedClientState)) {
    setClientState(updatedClientState);
  }
};

const HermesDebugger = () => {
  const [clientState, setClientState] = useState({});

  useEffect(() => {
    /* scan immediately */
    findAvailableDebugTargets(clientState, setClientState);
    /* ...then poll */
    const id = setInterval(() => {
      findAvailableDebugTargets(clientState, setClientState);
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, [clientState, setClientState]);

  const toolbarDropdown = () => {
    const handleDropDownChange = (index) => {
      if (clientState.targets[index]) {
        setClientState({
          ...clientState,
          selectedTarget: clientState.targets[index],
        });
      }
    };
    const targets = _.map(
      clientState.targets,
      (target) => `${target.id}: ${target.description}`
    );

    const dropdown = targets.length ? (
      <Dropdown onChange={handleDropDownChange} items={targets} />
    ) : (
      <Dropdown enabled={false} items={['none']} />
    );

    return (
      <div className={css(HermesStyles.toolbarContainer)}>
        <div className={css(HermesStyles.toolbarDebugTargetsText)}>
          debug targets:
        </div>
        {dropdown}
      </div>
    );
  };

  return (
    <PluginLayout title="react tools" toolbarComponents={[toolbarDropdown()]}>
      <div className={css(HermesStyles.outerWebViewContainer)}>
        <div
          className={css(HermesStyles.innerWebViewContainer)}
          id={HERMES_DEBUGGER_CONTAINER_ID}
        />
      </div>
      <ChromeDevTools
        url={clientState.selectedTarget?.devtoolsFrontendUrl}
        targets={clientState.targets}
        containerElementId={HERMES_DEBUGGER_CONTAINER_ID}
      />
    </PluginLayout>
  );
};

export default HermesDebugger;
