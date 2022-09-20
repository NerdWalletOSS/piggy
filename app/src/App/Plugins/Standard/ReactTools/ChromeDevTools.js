/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/* NOTE: stolen and modified/simplified/bugfixed from the Flipper code base */

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'aphrodite/no-important';
import styles from './HermesStyles';

const devToolsNodeId = (url) =>
  url
    ? `hermes-chromedevtools-out-of-react-node-${url.replace(/\W+/g, '-')}`
    : null;

const findDevToolsNode = (url) =>
  url ? document.querySelector(`#${devToolsNodeId(url)}`) : null;

const createDevToolsNode = (containerElementId, url) => {
  if (!url) {
    return null;
  }

  const existing = findDevToolsNode(url);
  if (existing) {
    return existing;
  }

  /* this was originally in the Flipper sources, but doesn't seem necessary
  any longer. we can probably remove this as soon as we can confirm everything
  works fine in release builds */
  // electron.remote.getCurrentWindow().webContents.toggleDevTools();
  // electron.remote.getCurrentWindow().webContents.closeDevTools();

  const wrapper = document.createElement('div');
  wrapper.id = devToolsNodeId(url);
  wrapper.style.height = '100%';
  wrapper.style.width = '100%';

  const iframe = document.createElement('webview');
  iframe.style.height = '100%';
  iframe.style.width = '100%';

  /* originally from the Flipper sources. the original comment says:
  HACK: chrome-devtools:// is blocked by the sandbox but devtools://
  isn't for some reason. */
  iframe.src = url.replace(/^chrome-/, '');
  iframe.disablewebsecurity = true;
  iframe.nodeintegrationinsubframes = true;
  iframe.nodeintegration = true;

  wrapper.appendChild(iframe);

  document.getElementById(containerElementId).appendChild(wrapper);
  return wrapper;
};

const showDevTools = (containerElementId, devToolsNode) => {
  if (devToolsNode) {
    const containerEl = document.getElementById(containerElementId);
    if (containerEl) {
      containerEl.style.display = 'block';
      containerEl.parentElement.style.display = 'block';
      containerEl.parentElement.style.height = '100%';
    }
    devToolsNode.style.display = 'block';
  }
};

const hideDevTools = (containerElementId) => {
  const containerEl = document.getElementById(containerElementId);
  if (containerEl) {
    containerEl.style.display = 'none';
    containerEl.parentElement.style.display = 'none';
    const children = containerEl.children || [];
    for (let i = 0; i < children.length; i++) {
      children[i].style.display = 'none';
    }
  }
};

const createAndAttachDevTools = (containerElementId, url) => {
  if (containerElementId && url) {
    const devToolsNode = createDevToolsNode(containerElementId, url);
    if (devToolsNode) {
      showDevTools(containerElementId, devToolsNode);
    }
  }
};

const removeOrphanedDevTools = (containerElementId, targets) => {
  const targetElementIds = new Set(
    (targets || []).map((target) => devToolsNodeId(target.devtoolsFrontendUrl))
  );
  const containerEl = document.getElementById(containerElementId);
  if (containerEl) {
    const children = containerEl.children || [];
    for (let i = 0; i < children.length; i++) {
      if (!targetElementIds.has(children[i].id)) {
        children[i].remove();
      }
    }
  }
};

const NoTargetsAvailable = () => (
  <div className={css(styles.errorWrapper)}>
    <div className={css(styles.errorContainer)}>
      <div>no debug targets available. go start the app!</div>
    </div>
  </div>
);

const ChromeDevTools = ({ url, targets, containerElementId }) => {
  useEffect(() => {
    removeOrphanedDevTools(containerElementId, targets);
    createAndAttachDevTools(containerElementId, url);
    return () => hideDevTools(containerElementId);
  }, [containerElementId, targets, url]);
  if (!url) {
    return <NoTargetsAvailable />;
  }
  return undefined;
};

ChromeDevTools.propTypes = {
  containerElementId: PropTypes.string.isRequired,
  targets: PropTypes.array.isRequired,
  url: PropTypes.string.isRequired,
};

export default ChromeDevTools;
