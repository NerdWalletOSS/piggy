import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { css } from 'aphrodite/no-important';
import { flatten, unflatten } from 'flat';
import ReactJson from 'react-json-view';
import { ToolbarIcon } from '@widgets/Toolbar';
import { debouncedUpdate } from '@plugins/Standard/EventLog/utils';
import { syntaxTheme } from '@lib/colors';
import { indexChildren, searchChildren } from '@lib/search';
// eslint-disable-next-line import/no-named-default
import { default as eventLogStyles } from '@plugins/Standard/EventLog/EventLogStyles';
import { styles } from './SearchableDetailsPaneStyles';

const DetailsSearch = ({
  eventId,
  childrenToSearch,
  rootPath,
  showSearchBar,
  onClosePressed,
  searchResultResolver,
}) => {
  const detailsSearchRef = React.createRef();
  const [searchTerm, setSearchTerm] = useState('');
  const [processedSearchResult, setProcessedSearchResult] = useState(null);
  const [isDetailsIndexed, setDetailsIndexed] = useState(false);
  const flattenedChildren = useMemo(
    () => _.map(childrenToSearch, (child) => flatten(child)),
    [childrenToSearch]
  );

  useEffect(() => {
    if (showSearchBar) {
      debouncedUpdate(searchTerm, async () => {
        indexChildren(eventId, flattenedChildren, async () => {
          if (!_.isEmpty(searchTerm)) {
            const flattenedResult = await searchChildren(
              eventId,
              rootPath,
              searchTerm,
              flattenedChildren,
              searchResultResolver
            );
            setProcessedSearchResult(
              _.map(flattenedResult, (result) => unflatten(result))
            );
          }
          setDetailsIndexed(true);
        });
      });
    } else {
      setDetailsIndexed(false);
      setProcessedSearchResult(null);
    }
  }, [
    searchTerm,
    eventId,
    flattenedChildren,
    showSearchBar,
    isDetailsIndexed,
    rootPath,
    searchResultResolver,
  ]);

  const handleClosePressed = () => {
    setDetailsIndexed(false);
    setProcessedSearchResult(null);
    if (onClosePressed) {
      onClosePressed();
    }
  };

  const mainContent = useMemo(() => {
    const renderSearchResult =
      searchTerm && processedSearchResult && showSearchBar;

    const childrenToRender = renderSearchResult
      ? processedSearchResult
      : childrenToSearch;

    const children = _.map(childrenToRender, (child) => {
      let childData;
      if (
        !renderSearchResult &&
        !_.isEmpty(rootPath) &&
        !searchResultResolver
      ) {
        childData = _.get(child, rootPath);
      } else if (child.data !== undefined) {
        childData = child.data;
      } else {
        childData = child;
      }
      return (
        <ReactJson
          theme={syntaxTheme}
          style={{ userSelect: 'text', backgroundColor: 'transparent' }}
          name={child.displayName || 'item'}
          src={childData}
          collapsed={child.collapsed || (showSearchBar ? false : 3)}
          sortKeys
        />
      );
    });
    return (
      <div className={css(styles.detailPaneContainer)}>
        <div className={css(styles.detailPaneColumn)}>{children}</div>
      </div>
    );
  }, [
    childrenToSearch,
    processedSearchResult,
    searchTerm,
    showSearchBar,
    rootPath,
    searchResultResolver,
  ]);

  const onDetailsSearchChange = () => {
    setSearchTerm(detailsSearchRef.current.value);
  };

  const onDetailSearchKeyDown = (event) => {
    if (event.keyCode === 27) {
      handleClosePressed();
    }
  };

  return (
    <div
      className={css(styles.detailsJson)}
      onClick={(e) => e.stopPropagation()}
    >
      {showSearchBar && (
        <div className={css(styles.detailsSearchToolbar)}>
          <input
            onKeyDown={onDetailSearchKeyDown}
            onChange={onDetailsSearchChange}
            onSubmit={onDetailsSearchChange}
            placeholder="search details"
            className={css(
              eventLogStyles.searchInput,
              eventLogStyles.toolbarComponent,
              styles.detailsSearchInput
            )}
            value={searchTerm}
            ref={detailsSearchRef}
            // Enabling autofocus here because it makes sense to focus here when the search first opens
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          <ToolbarIcon
            isOn={false}
            fontAwesomeIcon={faTimesCircle}
            tooltip={<span>close</span>}
            onClick={() => {
              if (setSearchTerm) setSearchTerm('');
              handleClosePressed();
            }}
          />
        </div>
      )}
      {mainContent}
    </div>
  );
};

DetailsSearch.propTypes = {
  eventId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  childrenToSearch: PropTypes.arrayOf(PropTypes.object),
  rootPath: PropTypes.string,
  onClosePressed: PropTypes.func.isRequired,
  showSearchBar: PropTypes.bool.isRequired,
  searchResultResolver: PropTypes.func,
};

DetailsSearch.defaultProps = {
  childrenToSearch: [],
  rootPath: '',
  searchResultResolver: null,
};

export default DetailsSearch;
