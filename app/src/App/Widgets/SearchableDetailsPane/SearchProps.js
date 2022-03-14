import PropTypes from 'prop-types';

export const searchItemProps = PropTypes.shape({
  colorHint: PropTypes.string,
  data: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  level: PropTypes.string,
});

export const searchConfigProps = PropTypes.shape({
  detailSectionPaths: PropTypes.arrayOf(PropTypes.string),
});
