import _ from 'lodash';
import React from 'react';
import { css } from 'aphrodite/no-important';
import styles from '@plugins/Standard/EventLog/EventLogStyles';
import {
  EVENT_TYPES,
  TYPE_TO_LABEL,
} from '@plugins/Standard/EventLog/EventConstants';
import ChipWrapper from './ChipWrapper';

const ArrayChip = (item, arg, rowIndex, chipIndex, chipClicked) => {
  let value = arg;
  let chipTypeStyle = styles.arrayTextLabel;
  let clickable;
  if (_.isArray(arg)) {
    value = '[array]';
    chipTypeStyle = styles.arrayObjectLabel;
    clickable = true;
  } else if (_.isObject(arg)) {
    value = '{ object }';
    chipTypeStyle = styles.arrayObjectLabel;
    clickable = true;
  } else if (!_.isString(arg)) {
    value = String(arg);
    if (_.isBoolean(arg)) {
      chipTypeStyle = arg
        ? styles.arrayBoolTrueLabel
        : styles.arrayBoolFalseLabel;
    } else if (_.isNumber(arg)) {
      chipTypeStyle = styles.arrayNumberLabel;
    }
  }
  const onClick =
    chipClicked &&
    clickable &&
    ((ev) => {
      ev.stopPropagation();
      chipClicked({
        item,
        itemId: item.id,
        index: rowIndex,
        title: `data for argument #${chipIndex}`,
        label: TYPE_TO_LABEL[EVENT_TYPES.CONSOLE],
        timestamp: item.timestamp,
        displayName: value,
        chipPath: `data.${chipIndex}`,
      });
    });
  return (
    <ChipWrapper clickable={!!onClick} key={chipIndex.toString()}>
      <div
        className={css([
          styles.chip,
          onClick && styles.clickableChip,
          chipTypeStyle,
        ])}
        onClick={onClick}
      >
        {value || '<empty>'}
      </div>
    </ChipWrapper>
  );
};

export default ArrayChip;
