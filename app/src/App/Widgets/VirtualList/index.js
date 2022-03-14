import ReactWindowVirtualList from './ReactWindowVirtualList';
import VirtuosoVirtualList from './VirtuosoVirtualList';

export const VIRTUAL_LIST_TYPE = {
  REACT_WINDOW: 'react-window',
  VIRTUOSO: 'virtuoso',
};

export const CURRENT_VIRTUAL_LIST_TYPE = VIRTUAL_LIST_TYPE.VIRTUOSO;

const VirtualListType =
  CURRENT_VIRTUAL_LIST_TYPE === VIRTUAL_LIST_TYPE.VIRTUOSO
    ? VirtuosoVirtualList
    : ReactWindowVirtualList;

export default VirtualListType;
