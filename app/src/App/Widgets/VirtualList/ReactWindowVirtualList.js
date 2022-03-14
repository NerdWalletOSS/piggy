import _ from 'lodash';
import React, { PureComponent } from 'react';
import { DynamicSizeList } from 'react-window';
import PropTypes from 'prop-types';

/* this abstraction attempts to work around the fact you can't scroll to items that
haven't yet been measured by messing with `scrollTo`. We should consider using
something like this solution instead: https://gist.github.com/tsirlucas/637c948e1e55a3c2439df9b87ec6a13b */
class ReactWindowVirtualList extends PureComponent {
  constructor(props) {
    super(props);
    this.listRef = React.createRef();
    this.innerRef = null;
    this.outerRef = null;
    this.lastCount = 0;
    this.pinToBottom = true;
    this.mouseDown = false;
    this.lastScrollTop = 0;
    this.state = { keyCount: 0 };
  }

  onItemsRendered = _.throttle(() => {
    this.adjustScrollPosition();
  }, 100);

  componentDidUpdate(prevProps) {
    const { disablePinToBottom } = this.props;
    const { disablePinToBottom: prevDisablePinToBottom } = prevProps;
    if (disablePinToBottom !== prevDisablePinToBottom) {
      this.adjustScrollPosition();
    }
  }

  setInnerRef = (ref) => {
    if (this.innerRef) {
      this.innerRef.removeEventListener('wheel', this.handleMouseWheel);
    }
    if (ref) {
      ref.addEventListener('wheel', this.handleMouseWheel);
    }
    this.innerRef = ref;
  };

  setOuterRef = (ref) => {
    if (this.outerRef) {
      this.outerRef.removeEventListener('scroll', this.handleScroll);
      this.outerRef.removeEventListener('mousedown', this.handleMouseDown);
      this.outerRef.removeEventListener('mouseup', this.handleMouseUp);
    }
    if (ref) {
      ref.addEventListener('scroll', this.handleScroll);
      ref.addEventListener('mousedown', this.handleMouseDown);
      ref.addEventListener('mouseup', this.handleMouseUp);
    }
    this.outerRef = ref;
  };

  setPinToBottom = (pin) => {
    if (pin !== this.pinToBottom) {
      console.log('setPinToBottom', pin);
      this.pinToBottom = pin;
      const { onPinChanged } = this.props;
      if (onPinChanged) {
        onPinChanged(pin);
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
    if (this.pinToBottom && ev.deltaY < 0) {
      console.log('user scrolled up, unpinning immediately');
      this.setPinToBottom(false);
    }
  };

  handleScroll = () => {
    if (!this.isScrollable()) {
      this.setPinToBottom(true);
      return;
    }
    const { pinToBottom } = this.state;
    let shouldPin;
    if (this.innerRef && this.outerRef) {
      const { scrollTop, clientHeight } = this.outerRef;
      const bottomEdge = scrollTop + clientHeight;
      const scrollHeight = this.innerRef.clientHeight;
      const distanceFromBottom = scrollHeight - bottomEdge;
      const scrollDirection =
        scrollTop - this.lastScrollTop > 1 ? 'forward' : 'backward';
      // console.log(scrollDirection, 'distance from bottom', distanceFromBottom);
      if (scrollDirection === 'forward' && distanceFromBottom < 32) {
        // console.log('user scrolled forward, and is near the end. pinning...');
        shouldPin = true;
      } else if (scrollDirection === 'backward' && distanceFromBottom > 200) {
        // console.log(
        //   'user scrolled backwards, and is far from the end. unpinning...'
        // );
        shouldPin = false;
      }
      if (shouldPin !== undefined && shouldPin !== pinToBottom) {
        this.setPinToBottom(shouldPin);
      }
      this.lastScrollTop = scrollTop;
    }
  };

  reset = () => {
    this.scrollToTop();
    this.lastCount = 0;
    this.pinToBottom = true;
    this.lastScrollTop = 0;
  };

  adjustScrollPosition = () => {
    const { itemCount, disablePinToBottom } = this.props;
    const { keyCount } = this.state;

    const count = itemCount || 0;

    /* if the number of items in the list suddenly decreases, the component
    needs to be re-created because it's not smart enough to recalculate. we
    do this by updating the List's `key` property to something new */
    if (count < this.lastCount) {
      this.setState(
        {
          keyCount: keyCount + 1,
        },
        () => {
          this.checkScrollToBottom();
          this.lastCount = count;
        }
      );
    } else {
      if (!this.mouseDown && !disablePinToBottom) {
        if (count === 0) {
          this.scrollToTop();
        } else {
          this.checkScrollToBottom();
        }
      }
      this.lastCount = count;
    }
  };

  isScrollable = () =>
    this.listRef.current &&
    this.innerRef &&
    this.outerRef &&
    this.innerRef.offsetHeight > this.outerRef.offsetHeight;

  scrollToBottomAndPin = () => {
    this.setPinToBottom(true);
    this.scrollToBottom();
  };

  scrollToItem = (index) => {
    if (this.listRef.current) {
      this.listRef.current.scrollToItem(index);
    }
  };

  checkScrollToBottom = () => {
    const shouldScrollToBottom = this.lastCount === 0 || this.pinToBottom;
    /* if we were previously at the bottom, scroll back to the bottom */
    if (shouldScrollToBottom) {
      this.scrollToBottom();
    }
  };

  scrollToTop = () => {
    if (this.outerRef) {
      this.outerRef.scrollTop = 0;
    }
  };

  scrollToBottom = () => {
    /* only call `scrollTo()` when there is a scrollable area
    (i.e. innerHeight > outerHeight), scroll to the new bottom. note the height
    check is require, otherwise things may get out of whack due to the inner
    workings of the library */
    if (this.isScrollable()) {
      this.outerRef.scrollTop = Number.MAX_SAFE_INTEGER;
      // console.log('***** scrollToBottom()');
    }
  };

  render = () => {
    const {
      itemType: ItemType,
      itemData,
      itemProps,
      overscanCount,
      ...restProps
    } = this.props;

    const RefForwarder = React.forwardRef((props, ref) => (
      <ItemType forwardedRef={ref} {...(itemProps || {})} {...props} />
    ));

    const { keyCount } = this.state;

    return (
      <DynamicSizeList
        ref={this.listRef}
        outerRef={this.setOuterRef}
        innerRef={this.setInnerRef}
        key={keyCount.toString()}
        itemData={itemData}
        overscanCount={overscanCount}
        onItemsRendered={this.onItemsRendered}
        {...restProps}
      >
        {RefForwarder}
      </DynamicSizeList>
    );
  };
}

ReactWindowVirtualList.propTypes = {
  itemType: PropTypes.any.isRequired,
  itemCount: PropTypes.number.isRequired,
  itemData: PropTypes.array,
  itemProps: PropTypes.object,
  onPinChanged: PropTypes.func,
  disablePinToBottom: PropTypes.bool,
  overscanCount: PropTypes.number,
};

ReactWindowVirtualList.defaultProps = {
  itemProps: {},
  itemData: [],
  onPinChanged: undefined,
  disablePinToBottom: false,
  overscanCount: 64,
};

export default ReactWindowVirtualList;
