import React from 'react';
import PropTypes from 'prop-types';
import AutoSizer from 'react-virtualized-auto-sizer';
import { css } from 'aphrodite/no-important';
import VirtualList, {
  CURRENT_VIRTUAL_LIST_TYPE,
  VIRTUAL_LIST_TYPE,
} from '@widgets/VirtualList';
import styles from './EventLogStyles';

const EventLogVirtualList = React.memo(
  ({
    itemType: ItemType,
    eventHandler,
    events,
    count,
    selectedItemId,
    markedItems,
    highlightedItems,
    disablePinToBottom,
    pinToBottomChanged,
    overscanCount,
    innerWrapperStyle = {},
    outerWrapperStyle = {},
  }) => {
    if (CURRENT_VIRTUAL_LIST_TYPE === VIRTUAL_LIST_TYPE.VIRTUOSO) {
      const renderVirtuosoItem = (index) => (
        <ItemType
          rowClicked={eventHandler.rowClicked}
          chipClicked={eventHandler.chipClicked}
          markerClicked={eventHandler.markerClicked}
          urlClicked={eventHandler.urlClicked}
          markedItems={markedItems}
          highlightedItems={highlightedItems}
          selectedItemId={selectedItemId}
          index={index}
          data={events}
        />
      );

      return (
        <div className={css(styles.mainContainer)} style={outerWrapperStyle}>
          <div className={css(styles.list)} style={innerWrapperStyle}>
            <AutoSizer>
              {({ height, width }) => (
                <VirtualList
                  ref={eventHandler.setVirtualListRef}
                  style={{ width, height }}
                  totalCount={count}
                  item={renderVirtuosoItem}
                  onPinChanged={pinToBottomChanged}
                  disablePinToBottom={disablePinToBottom}
                  overscanCount={overscanCount}
                />
              )}
            </AutoSizer>
          </div>
        </div>
      );
    }

    return (
      <div className={css(styles.mainContainer)} style={outerWrapperStyle}>
        <div className={css(styles.list)} style={innerWrapperStyle}>
          <AutoSizer>
            {({ height, width }) => (
              <VirtualList
                ref={eventHandler.setVirtualListRef}
                itemType={ItemType}
                itemData={events}
                itemCount={count}
                itemProps={{
                  rowClicked: eventHandler.rowClicked,
                  chipClicked: eventHandler.chipClicked,
                  markerClicked: eventHandler.markerClicked,
                  urlClicked: eventHandler.urlClicked,
                  selectedItemId,
                  markedItems,
                  highlightedItems,
                }}
                width={width}
                height={height}
                overscanCount={overscanCount}
                onPinChanged={pinToBottomChanged}
                disablePinToBottom={disablePinToBottom}
              />
            )}
          </AutoSizer>
        </div>
      </div>
    );
  }
);

EventLogVirtualList.propTypes = {
  itemType: PropTypes.object.isRequired,
  eventHandler: PropTypes.object.isRequired,
  events: PropTypes.array.isRequired,
  count: PropTypes.number.isRequired,
  selectedItemId: PropTypes.number.isRequired,
  markedItems: PropTypes.object.isRequired,
  highlightedItems: PropTypes.object.isRequired,
  disablePinToBottom: PropTypes.bool.isRequired,
  pinToBottomChanged: PropTypes.func,
  overscanCount: PropTypes.number,
  innerWrapperStyle: PropTypes.object,
  outerWrapperStyle: PropTypes.object,
};

EventLogVirtualList.defaultProps = {
  pinToBottomChanged: undefined,
  overscanCount: 64,
  innerWrapperStyle: {},
  outerWrapperStyle: {},
};

export default EventLogVirtualList;
