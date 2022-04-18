import _ from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import colors, { offsetColor } from '@lib/colors';
import PropTypes from 'prop-types';
import HermesDebugger from './HermesDebugger';
import ReactDevTools from './ReactDevTools';

const TRANSITION_IN = 'color .1s ease-in, background-color .1s ease-in';
const TAB_BORDER_COLOR = colors.green;

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
  tabButtonContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
    marginTop: 8,
    padding: 8,
    textAlign: 'center',
    borderTop: `2px solid transparent`,
    borderBottom: `1px solid ${TAB_BORDER_COLOR}`,
    outline: 'none',
    backgroundColor: colors.background,
    color: colors.foreground,
    boxSizing: 'border-box',
    cursor: 'pointer',
    transition: TRANSITION_IN,
    ':first-child': {
      borderLeft: 'none',
      borderTopLeftRadius: 0,
    },
    ':last-child': {
      borderRight: 'none',
      borderTopRightRadius: 0,
    },
    ':hover': {
      backgroundColor: offsetColor(colors.background, 0.15),
    },
  },
  tabButtonSelected: {
    backgroundColor: offsetColor(colors.tabBackground, -0.2),
    border: `2px solid ${TAB_BORDER_COLOR}`,
    color: TAB_BORDER_COLOR,
    textDecoration: 'underline',
    borderBottom: 'none',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  selectedToolContainer: {
    display: 'flex',
    backgroundColor: 'blue',
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
});

const TabButton = ({ name, onClick, selected }) => {
  console.log('TabButton');
  return (
    <div
      className={css(
        styles.tabButton,
        selected ? styles.tabButtonSelected : null
      )}
      onClick={onClick}
    >
      {name}
    </div>
  );
};

TabButton.propTypes = {
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
};

const TabBar = ({ tabs, onSelectedIndexChange }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleButtonClick = useCallback(
    (index) => {
      if (index !== selectedIndex) {
        setSelectedIndex(index);
        onSelectedIndexChange?.(index, tabs[index].id);
      }
    },
    [tabs, selectedIndex, setSelectedIndex, onSelectedIndexChange]
  );

  const buttons = useMemo(
    () =>
      _.map(tabs, (tab, index) => (
        <TabButton
          name={tab.name}
          selected={selectedIndex === index}
          onClick={() => handleButtonClick(index)}
        />
      )),
    [selectedIndex, handleButtonClick, tabs]
  );

  return <div className={css(styles.tabButtonContainer)}>{buttons}</div>;
};

TabBar.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSelectedIndexChange: PropTypes.func.isRequired,
};

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
