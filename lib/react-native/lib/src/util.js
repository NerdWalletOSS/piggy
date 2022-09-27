import _ from 'lodash';

/* we know certain keys have values so large they blow up the bridge or just
take too long to process. this is a list of those keys */
export const KEY_BLOCKLIST = new Set([
  '_reactInternalFiber',
  '_internalFiberInstanceHandle',
  '_internalFiberInstanceHandleDEV',
]);

const processStackTrace = async (exception) => {
  /* we can use RN's built-in `symbolicateStackTrace` to get user-friendly stack traces */
  if (navigator && navigator.product === 'ReactNative') {
    try {
      /* eslint-disable-next-line */
      const symbolicateStackTrace = require('react-native/Libraries/Core/Devtools/symbolicateStackTrace');
      /* eslint-disable-next-line */
      const parseErrorStack = require('react-native/Libraries/Core/Devtools/parseErrorStack');
      if (
        exception &&
        exception.stack &&
        parseErrorStack &&
        symbolicateStackTrace
      ) {
        const parsedStack = parseErrorStack(exception?.stack);
        const symbolicatedStack = await symbolicateStackTrace(parsedStack);
        if (symbolicatedStack?.stack?.length) {
          return _.map(
            symbolicatedStack.stack,
            ({ column, file, lineNumber, methodName }) => ({
              column,
              file,
              lineNumber,
              methodName,
            })
          );
        }
      }
    } catch (ex) {
      /* swallow; couldn't symbolicate! */
    }
  }
  return exception.stack.split('\n');
};

export const clean = async (value) => {
  if (value instanceof Error && value.stack) {
    return processStackTrace(value);
  }
  if (value instanceof Promise) {
    return '<Promise>';
  }
  if (_.isNaN(value)) {
    return '<NaN>';
  }
  if (value === Infinity) {
    return '<Infinity>';
  }
  if (_.isFunction(value)) {
    return '<Function>';
  }
  if (_.isSymbol(value)) {
    return '<Symbol>';
  }
  return value;
};

export const isObjectNotFunction = (item) =>
  _.isObject(item) && !_.isFunction(item) && !(item instanceof Error);

/* eslint-disable no-await-in-loop */
export const deepClean = async (input, redactor, visited, path) => {
  visited = visited || new Set();
  const locallyVisited = new Set();
  const output = {};
  const keys = Object.keys(input);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = input[key];
    const currentPath = (path ? `${path}.` : '') + key;
    if (KEY_BLOCKLIST.has(key) || KEY_BLOCKLIST.has(currentPath)) {
      output[key] = '<Internally-Redacted>';
    } else if (redactor && redactor(key, currentPath)) {
      output[key] = '<User-Redacted>';
    } else if (visited.has(value) && !locallyVisited.has(value)) {
      output[key] = '<Circular-Reference>';
    } else {
      if (isObjectNotFunction(value) && !visited.has(value)) {
        visited.add(value);
        locallyVisited.add(value);
      }
      if (_.isArray(value)) {
        const array = [];
        for (let k = 0; k < value.length; k++) {
          const item = value[k];
          if (isObjectNotFunction(item) || _.isArray(item)) {
            array[k] = await deepClean(item, redactor, visited, currentPath);
          } else {
            array[k] = await clean(item);
          }
        }
        output[key] = array;
      } else if (isObjectNotFunction(value)) {
        output[key] = await deepClean(value, redactor, visited, currentPath);
      } else {
        output[key] = await clean(value);
      }
    }
  }
  locallyVisited.forEach((value) => visited.delete(value));
  return output;
};
/* eslint-enable no-await-in-loop */
