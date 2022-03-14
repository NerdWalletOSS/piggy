import React from 'react';
import styles from '@plugins/Standard/EventLog/EventLogStyles';
import ArrayRow from './ArrayRow';

const ConsoleRow = ({ ...props }) => (
  <ArrayRow tagStyles={[styles.consoleTag]} {...props} />
);

export default ConsoleRow;
