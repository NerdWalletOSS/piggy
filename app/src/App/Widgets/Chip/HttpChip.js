import _ from 'lodash';
import React from 'react';
import { css } from 'aphrodite/no-important';
import styles from '@plugins/Standard/EventLog/EventLogStyles';
import { getItemTitle } from '@plugins/Standard/EventLog/utils';
import {
  EVENT_TYPES,
  HTTP_SUBTYPE,
  TYPE_TO_LABEL,
} from '@plugins/Standard/EventLog/EventConstants';
import ChipWrapper from './ChipWrapper';

export const getHttpStatusCode = (item) =>
  _.get(item, 'data.status', _.get(item, 'data.response.status', -1));

const getHttpStatusStyle = (code) => {
  if (code <= 0) {
    return styles.httpDefaultLabel;
  }
  if ((code > 0 && code < 200) || (code > 299 && code < 400)) {
    return styles.httpWarningLabel;
  }
  if (code >= 400) {
    return styles.httpErrorLabel;
  }
  return styles.httpOkLabel;
};

export const HttpStatusChip = (item) => {
  const code = getHttpStatusCode(item);
  if (code < 0) {
    return null;
  }
  return (
    <ChipWrapper key={`${item.id}-http-status`}>
      <div
        className={css([
          styles.chip,
          getHttpStatusStyle(code),
          styles.httpStatus,
        ])}
      >{`${code}`}</div>
    </ChipWrapper>
  );
};

const HttpChip = (item, index, key, chipClicked) => {
  let caption = key;
  let chipTypeStyle = styles.httpDefaultLabel;
  let chipName = '{ object }';
  // Path from item to requested chip data
  let chipPath;
  if (key === 'url') {
    chipPath = '';
    caption = item.url;
    chipTypeStyle = styles.httpLink;
  } else if (key === 'method') {
    caption = _.get(item, 'data.request.method', '???').toLocaleLowerCase();
    chipTypeStyle = styles.httpMethod;
  } else if (key === HTTP_SUBTYPE.REQUEST) {
    chipPath = `data.${HTTP_SUBTYPE.REQUEST}`;
    chipTypeStyle = styles.httpDefaultLabel;
    chipName = 'request';
  } else if (key === HTTP_SUBTYPE.RESPONSE) {
    chipPath = `data.${HTTP_SUBTYPE.RESPONSE}`;
    chipTypeStyle = getHttpStatusStyle(getHttpStatusCode(item));
    chipName = 'response';
  } else if (key === 'title') {
    /* maybe not used anymore? */
    chipPath = '';
    caption = getItemTitle(item);
    chipTypeStyle = styles.httpLink;
  }

  const onClick =
    chipClicked &&
    ((ev) => {
      ev.stopPropagation();
      chipClicked({
        event: {
          x: ev.clientX,
          y: ev.clientY,
        },
        item,
        itemId: item.id,
        index,
        title: `data for '${key}'`,
        label: TYPE_TO_LABEL[EVENT_TYPES.HTTP],
        timestamp: item.timestamp,
        displayName: chipName,
        chipPath,
      });
    });
  return (
    <ChipWrapper clickable={!!onClick} key={key}>
      <div
        className={css([
          styles.chip,
          onClick && styles.clickableChip,
          chipTypeStyle,
        ])}
        onClick={onClick || undefined}
      >
        {caption}
      </div>
    </ChipWrapper>
  );
};

export default HttpChip;
