import React from 'react';
import { css } from 'aphrodite/no-important';
import _ from 'lodash';
import styles from '@plugins/Standard/EventLog/EventLogStyles';
import { getItemLabel } from '@plugins/Standard/EventLog/utils';
import { HTTP_SUBTYPE } from '@plugins/Standard/EventLog/EventConstants';
import IconWithLabel from '@widgets/IconWithLabel/IconWithLabel';
import { GenericChip, HttpChip, HttpStatusChip } from '@widgets/Chip';
import settings from '@app/Settings';
import { CellBackground, RowMarker, Timestamp } from './RowComponents';
import { sharedItemPropTypes, sharedItemDefaultProps } from './SharedProps';

const userSettings = settings.get('user');

const HttpRow = ({
  index,
  item,
  marked,
  selected,
  highlighted,
  chipClicked,
  rowClicked,
  markerClicked,
  urlClicked,
}) => {
  const { level, url, timestamp } = item;
  const label = getItemLabel(item);
  const title = url;

  const chips = [];

  chips.push(HttpChip(item, index, 'method'));
  chips.push(HttpChip(item, index, 'url', urlClicked));
  const eventContextSettings = _.get(
    userSettings.get('httpRow.eventConfigs'),
    url
  );
  _.forEach(eventContextSettings, (setting, i) => {
    const chipPrefix = setting?.prefix || '';
    const value = _.get(item, setting?.path) || `<no ${setting?.path} defined>`;
    if (!_.isEmpty(chipPrefix + value)) {
      chips.push(
        <GenericChip
          item={item}
          caption={chipPrefix + value}
          key={`event-context-${i}`}
        />
      );
    }
  });
  if (item.data[HTTP_SUBTYPE.REQUEST]) {
    chips.push(HttpChip(item, index, HTTP_SUBTYPE.REQUEST, chipClicked));
  }
  if (item.data[HTTP_SUBTYPE.RESPONSE]) {
    chips.push(HttpChip(item, index, HTTP_SUBTYPE.RESPONSE, chipClicked));
    chips.push(HttpStatusChip(item));
  }

  return [
    <CellBackground
      {...{ rowClicked, index, selected, highlighted, item, label, title }}
    />,
    <div
      key="content"
      className={css(styles.cell)}
      onClick={() => rowClicked({ index, item, itemId: item.id, label, title })}
    >
      <div className={css(styles.chipGroup)}>
        <IconWithLabel
          label={label}
          level={level}
          tagStyles={[styles.navigationTag]}
        />
        {_.compact(chips)}
      </div>
      {timestamp && <Timestamp timestamp={timestamp} />}
      <RowMarker item={item} onClick={markerClicked} marked={marked} />
    </div>,
  ];
};

HttpRow.propTypes = {
  ...sharedItemPropTypes,
};

HttpRow.defaultProps = {
  ...sharedItemDefaultProps,
};

export default HttpRow;
