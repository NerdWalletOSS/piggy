import _ from 'lodash';
import React from 'react';
import { css } from 'aphrodite/no-important';
import styles from '@plugins/Standard/EventLog/EventLogStyles';
import ChipWrapper from './ChipWrapper';

const DurationChip = (item) => {
  const duration = _.get(item, [
    'data',
    'response',
    'data',
    'extensions',
    'tracing',
    'duration',
  ]);
  const durationMs = duration / (1000 * 1000);
  if (duration < 0 || duration === undefined) {
    return null;
  }
  return (
    <ChipWrapper key={`${item.id}-duration`}>
      <div className={css([styles.chip, styles.httpStatus])}>{`${Math.round(
        durationMs
      )} ms`}</div>
    </ChipWrapper>
  );
};

export default DurationChip;
