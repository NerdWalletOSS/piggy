import _ from 'lodash';

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
    return '<function>';
  }
  if (_.isSymbol(value)) {
    return '<Symbol>';
  }
  return value;
};

export const isObjectNotFunction = (item) =>
  _.isObject(item) && !_.isFunction(item) && !(item instanceof Error);

export const deepClean = async (input) => {
  const obj = input;
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = obj[key];
    if (_.isArray(value)) {
      const array = value;
      for (let k = 0; k < array.length; k++) {
        const item = array[k];
        if (isObjectNotFunction(item) || _.isArray(item)) {
          /* eslint-disable-next-line */
          array[k] = await deepClean(item);
        } else {
          /* eslint-disable-next-line */
          array[k] = await clean(item);
        }
      }
    } else if (isObjectNotFunction(value)) {
      /* eslint-disable-next-line */
      await deepClean(value);
    } else {
      /* eslint-disable-next-line */
      obj[key] = await clean(value);
    }
  }
  return obj;
};
