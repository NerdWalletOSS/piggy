import React, { useCallback, useState } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import TabBar from '@widgets/TabBar/TabBar';
import PropTypes from 'prop-types';
import HermesDebugger from './HermesDebugger';
import ReactDevTools from './ReactDevTools';

const TOOL_ID = {
  REACT_DEVTOOLS: 0,
  HERMES_DEBUGGER: 1,
};

const TOOL_TABS = [
  { name: 'react devtools', id: TOOL_ID.REACT_DEVTOOLS },
  { name: 'hermes debugger', id: TOOL_ID.HERMES_DEBUGGER },
];

const styles = StyleSheet.create({
  mainContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
  },
  selectedToolContainer: {
    display: 'flex',
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
});

const ToolWrapper = ({ hidden, children }) => (
  <div
    className={css([
      styles.selectedToolContainer,
      hidden ? styles.hidden : null,
    ])}
  >
    {children}
  </div>
);

ToolWrapper.propTypes = {
  hidden: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

const ReactTools = () => {
  const [selectedId, setSelectedId] = useState(0);

  const handleTabBarSelectedIndexChanged = useCallback(
    (_index, id) => {
      setSelectedId(id);
    },
    [setSelectedId]
  );

  return (
    <div className={css(styles.mainContainer)}>
      <TabBar
        onSelectedIndexChange={handleTabBarSelectedIndexChanged}
        tabs={TOOL_TABS}
      />
      <div className={css(styles.selectedToolContainer)}>
        <ToolWrapper hidden={selectedId !== TOOL_ID.REACT_DEVTOOLS}>
          <ReactDevTools />
        </ToolWrapper>
        <ToolWrapper hidden={selectedId !== TOOL_ID.HERMES_DEBUGGER}>
          <HermesDebugger />
        </ToolWrapper>
      </div>
    </div>
  );
};

export default ReactTools;
