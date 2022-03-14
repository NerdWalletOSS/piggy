import SearchApi from 'js-worker-search';
import _ from 'lodash';

const searchCache = {};

export const getIsIndexed = (id) => searchCache[id] !== undefined;

export const getSearchApiForEventId = (id) => {
  const isIndexed = getIsIndexed(id);
  if (!isIndexed) {
    searchCache[id] = { searchApi: new SearchApi(), isIndexed };
  } else {
    searchCache[id].isIndexed = isIndexed;
  }
  return searchCache[id];
};

export const indexChildren = (
  eventId,
  flattenedChildren,
  onComplete,
  reindex = false
) => {
  const { searchApi, isIndexed } = getSearchApiForEventId(eventId);
  if (!isIndexed || reindex) {
    _.forEach(flattenedChildren, (child, index) => {
      _.forIn(child, (value, key) => {
        searchApi.indexDocument(`${index}.devtool_key_index.${key}`, key);
        if (value) {
          searchApi.indexDocument(`${index}.${key}`, value.toString());
        }
      });
    });
  }
  if (onComplete) {
    onComplete();
  }
};

export const searchChildren = async (
  eventId,
  rootPath,
  detailsSearch,
  flattenedChildren,
  searchResultResolver
) => {
  const { searchApi } = getSearchApiForEventId(eventId);
  const flattenedResult = _.map(flattenedChildren, () => ({}));
  // Array of keys whose values in flattenedChildren contain the searched term
  const rawSearchResult = await searchApi.search(detailsSearch);
  _.forEach(rawSearchResult, (result) => {
    const index = _.parseInt(_.split(result, '.', 1)[0]);
    const isKey = _.split(result, 'devtool_key_index.');
    const key =
      isKey.length > 1 ? isKey[1] : result.substring(result.indexOf('.') + 1);
    // If the result is not in the path that is wanted, for example when searching a chip subset of detailsData,
    // exclude the result.
    if (!searchResultResolver) {
      if (_.startsWith(key, rootPath)) {
        flattenedResult[index][key] = flattenedChildren[index][key];
      }
    } else {
      searchResultResolver(
        flattenedResult,
        flattenedChildren,
        result,
        index,
        key,
        rootPath
      );
    }
  });
  return flattenedResult;
};
