import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'aphrodite/no-important';
import { insertIf } from '@lib/utils';
import { detailsDataProps } from '@widgets/ListRow/SharedProps';
import DetailsSearch from './DetailsSearch';
import { styles } from './SearchableDetailsPaneStyles';
import { searchConfigProps } from './SearchProps';

const SearchableDetailsPane = React.memo(
  ({
    detailsData,
    searchConfig,
    showDetailsSearch,
    toggleShowDetailsSearch,
    showTitle,
  }) => {
    if (!detailsData) {
      return null;
    }
    const { detailSectionPaths } = searchConfig;
    const { item, title } = detailsData;
    const { id } = item;
    let childrenToSearch = [];

    /* each detailsSectionPath corresponds to a section in the details pane */
    _.map(detailSectionPaths, (path) => {
      let sectionData = _.get(detailsData, path);
      /* support rendering paths to specific data items that are not objects */
      if (!_.isObject(sectionData) && _.has(detailsData, path)) {
        sectionData = [sectionData];
      }
      childrenToSearch = childrenToSearch.concat(
        insertIf(sectionData, { data: sectionData, displayName: path })
      );
    });

    const rootPath = _.get(detailsData, 'chipPath');

    return (
      <div className={css(styles.detailsWrapper)}>
        {showTitle && (
          <div className={css(styles.detailsTitle)}>
            <div className={css(styles.detailsTitleText)}>{title}</div>
          </div>
        )}
        <DetailsSearch
          eventId={id}
          childrenToSearch={childrenToSearch}
          rootPath={rootPath}
          showSearchBar={showDetailsSearch}
          onClosePressed={toggleShowDetailsSearch}
        />
      </div>
    );
  }
);

SearchableDetailsPane.propTypes = {
  detailsData: detailsDataProps.isRequired,
  searchConfig: searchConfigProps,
  toggleShowDetailsSearch: PropTypes.func.isRequired,
  showTitle: PropTypes.bool,
  showDetailsSearch: PropTypes.bool.isRequired,
};

SearchableDetailsPane.defaultProps = {
  searchConfig: {
    detailsSectionPaths: [],
  },
  showTitle: true,
};

export default SearchableDetailsPane;
