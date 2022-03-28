import React, { PureComponent } from 'react';
import { Virtuoso } from 'react-virtuoso';
import PropTypes from 'prop-types';

const SCROLLER_STYLE = {
  'overflow-x': 'hidden',
};

class VirtuosoVirtualList extends PureComponent {
  constructor(props) {
    super(props);
    this.listRef = React.createRef();
    this.state = {
      pinToBottom: true,
    };
  }

  setPinToBottom = (pin) => {
    const { pinToBottom } = this.state;
    if (pin !== pinToBottom) {
      console.log('setPinToBottom', pin);
      this.setState({ pinToBottom: pin });
      const { onPinChanged } = this.props;
      if (onPinChanged) {
        onPinChanged(pin);
      }
    }
  };

  scrollToBottomAndPin = () => {
    this.setPinToBottom(true);
    this.scrollToBottom();
  };

  scrollTo = (index, align) => {
    if (this.listRef.current && index > 0) {
      try {
        this.listRef.current.scrollToIndex({ index, align });
      } catch (e) {
        console.error('scrollToIndex failed', index, align, e);
      }
    }
  };

  scrollToTop = () => {
    this.scrollTo(0, 'start');
  };

  scrollToBottom = () => {
    const { totalCount } = this.props;
    this.scrollTo(totalCount - 1, 'end');
  };

  componentDidUpdate = () => {
    this.adjustScrollPosition();
  };

  reset = () => {
    this.scrollToTop();
    this.setState({ pinToBottom: true });
  };

  adjustScrollPosition = () => {
    const { disablePinToBottom, totalCount } = this.props;
    if (!this.mouseDown && !disablePinToBottom) {
      const { pinToBottom } = this.state;
      if (totalCount === 0) {
        this.scrollToTop();
      } else if (pinToBottom) {
        this.scrollToBottom();
      }
    }
  };

  handleMouseDown = () => {
    this.mouseDown = true;
  };

  handleMouseUp = () => {
    this.mouseDown = false;
    this.adjustScrollPosition();
  };

  handleMouseWheel = (ev) => {
    const { pinToBottom } = this.state;
    if (ev.deltaY < 0 && pinToBottom) {
      console.log('user scrolled up, unpinning immediately');
      this.setPinToBottom(false);
    } else if (
      ev.currentTarget &&
      ev.currentTarget.scrollTop + ev.currentTarget.clientHeight >=
        ev.currentTarget.scrollHeight
    ) {
      console.log('user scrolled to bottom, pinning!');
      this.setPinToBottom(true);
    }
  };

  render = () => {
    const {
      totalCount,
      overscanCount,
      disablePinToBottom,
      style,
      ...restProps
    } = this.props;
    const { pinToBottom } = this.state;
    const styleProps = { ...(style || {}), ...SCROLLER_STYLE };
    return (
      <Virtuoso
        ref={this.listRef}
        style={styleProps}
        totalCount={totalCount}
        overscan={overscanCount * 100}
        followOutput={!disablePinToBottom && pinToBottom}
        onWheel={this.handleMouseWheel}
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
        {...restProps}
      />
    );
  };
}

VirtuosoVirtualList.propTypes = {
  totalCount: PropTypes.number.isRequired,
  onPinChanged: PropTypes.func,
  disablePinToBottom: PropTypes.bool,
  overscanCount: PropTypes.number,
  style: PropTypes.object,
};

VirtuosoVirtualList.defaultProps = {
  onPinChanged: undefined,
  disablePinToBottom: false,
  overscanCount: 64,
  style: {},
};

export default VirtuosoVirtualList;
