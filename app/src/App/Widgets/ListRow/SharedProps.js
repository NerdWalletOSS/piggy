import PropTypes from 'prop-types';
import { searchItemProps } from '@widgets/SearchableDetailsPane/SearchProps';

export const sharedItemPropTypes = {
  index: PropTypes.number.isRequired,
  item: PropTypes.object.isRequired,
  label: PropTypes.string,
  title: PropTypes.string,
  marked: PropTypes.bool,
  highlighted: PropTypes.bool,
  selected: PropTypes.bool,
  rowClicked: PropTypes.func.isRequired,
  chipClicked: PropTypes.func,
  markerClicked: PropTypes.func,
  urlClicked: PropTypes.func,
};

export const sharedItemDefaultProps = {
  marked: false,
  selected: false,
  rowClicked: null,
  chipClicked: null,
  markerClicked: null,
  urlClicked: null,
};

export const detailsDataProps = PropTypes.shape({
  displayName: PropTypes.string,
  item: searchItemProps,
  label: PropTypes.string,
  timestamp: PropTypes.number,
  title: PropTypes.string,
  type: PropTypes.string,
  detailsType: PropTypes.string,
  itemId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
});
