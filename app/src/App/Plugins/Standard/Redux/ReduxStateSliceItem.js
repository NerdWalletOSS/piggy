import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
import { css } from 'aphrodite/no-important';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import Link from '@widgets/Link/Link';
import DetailsSearch from '@widgets/SearchableDetailsPane/DetailsSearch';
import styles from './ReduxStyles';

export const ReduxStateSliceItem = ({
  subscriptions,
  subscriptionKey,
  handleRemoveSubscription,
}) => {
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const subscription = subscriptions[subscriptionKey];

  const subscriptionSearchResultResolver = (
    flattenedResult,
    flattenedChildren,
    _result,
    index,
    key
  ) => {
    if (flattenedChildren) {
      const child = flattenedChildren[index];
      const subKey = _.replace(key, `${_.get(child, 'displayName')}`, 'data');
      flattenedResult[index][subKey] = flattenedChildren[index][subKey];
    }
  };

  const subscriptionPathViews = useMemo(
    () =>
      Object.keys(subscription).map((path) => {
        const pathValue = subscription[path];
        const pathFragments = path.split('.');
        const isPathValueAnObject = _.isPlainObject(pathValue);
        const displayTitle = isPathValueAnObject
          ? path
          : pathFragments.slice(0, pathFragments.length - 1).join('.');
        const displayData = isPathValueAnObject
          ? pathValue
          : { [pathFragments[pathFragments.length - 1]]: pathValue };
        return (
          <DetailsSearch
            eventId={`stateSubscription_${path}`}
            childrenToSearch={[
              {
                data: displayData,
                displayName: displayTitle,
                collapsed: 1,
              },
            ]}
            showSearchBar={searchBarOpen}
            searchResultResolver={subscriptionSearchResultResolver}
          />
        );
      }),
    [searchBarOpen, subscription]
  );

  return (
    <div className={css(styles.subscriptionContainer)}>
      <div className={css(styles.titleRow)}>
        <div className={css(styles.titleText)}>{subscriptionKey}</div>
        <Link
          style={[styles.subscriptionContainerButtons]}
          onClick={() => setSearchBarOpen(!searchBarOpen)}
        >
          <FontAwesomeIcon icon={faSearch} />
        </Link>
        <Link
          style={[
            styles.removeSubscription,
            styles.subscriptionContainerButtons,
          ]}
          data={subscriptionKey}
          onClick={handleRemoveSubscription}
        >
          <FontAwesomeIcon icon={faTimes} />
        </Link>
      </div>
      {subscriptionPathViews}
    </div>
  );
};

ReduxStateSliceItem.propTypes = {
  subscriptions: PropTypes.object.isRequired,
  subscriptionKey: PropTypes.string.isRequired,
  handleRemoveSubscription: PropTypes.func.isRequired,
};
