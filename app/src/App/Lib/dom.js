import ReactDOM from 'react-dom';

export const getRect = (ref) => {
  if (ref && ref.current) {
    const node = ReactDOM.findDOMNode(ref.current);
    if (node) {
      return node.getBoundingClientRect();
    }
  }
  return {
    bottom: 0,
    top: 0,
    left: 0,
    right: 0,
    height: 0,
    width: 0,
    x: 0,
    y: 0,
    invalid: true,
  };
};

export const contextMenu = (ref, mouseEvent) => {
  let rect;

  if (mouseEvent && mouseEvent.x !== undefined && mouseEvent.y !== undefined) {
    rect = { ...mouseEvent, cursor: true };
  } else {
    rect = getRect(ref);
  }

  if (rect.invalid) {
    return {};
  }

  const totalWidth = document.body.offsetWidth;
  const totalHeight = document.body.offsetHeight;

  const style = {
    left: 'unset',
    right: 'unset',
    top: 'unset',
    bottom: 'unset',
  };

  /* if no mouse event was specified, we'll center the menu
  in the selected element using these offsets */
  const xOffset = rect.cursor ? 0 : rect.width / 2;
  const yOffset = rect.cursor ? 0 : rect.height / 2;

  /* x offset */
  if (rect.x > totalWidth / 2) {
    style.right = totalWidth - rect.x - xOffset;
  } else {
    style.left = rect.x + xOffset;
  }

  /* y offset and size */
  if (rect.y < totalHeight / 2) {
    style.top = rect.y + yOffset;
    style.maxHeight = document.body.offsetHeight - style.top - 16;
  } else {
    style.bottom = totalHeight - rect.y - yOffset;
    style.maxHeight = document.body.offsetHeight - style.bottom - 16;
  }

  style.maxHeight = Math.max(32, style.maxHeight);

  return style;
};
