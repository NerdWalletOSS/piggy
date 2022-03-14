const _ = require('lodash');
const config = require('./config-overrides');

const aliases = _.get(config({ resolve: [] }), 'resolve.alias', {});
const mapped = _.map(aliases, (v, k) => [k, v]); /* ['@foo', '/path/to/bar'] */

module.exports = {
  plugins: ['prettier', 'react', 'react-hooks'],
  extends: ['airbnb', 'prettier'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      plugins: [
        '@babel/plugin-syntax-class-properties',
        '@babel/plugin-syntax-jsx',
      ],
    },
  },
  globals: {
    __DEV__: true,
    window: true,
    document: true,
    console: true,
  },
  env: {
    mocha: false,
    browser: false,
    jest: true,
  },
  settings: {
    'import/resolver': {
      alias: mapped,
    },
  },
  rules: {
    'class-methods-use-this': 'off',
    'global-require': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'import/prefer-default-export': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
    'jsx-a11y/no-noninteractive-tabindex': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/label-has-associated-control': [
      2,
      {
        controlComponents: ['Input', 'Dropdown'],
        depth: 3,
      },
    ],
    'no-alert': 'off',
    'no-console': 'off',
    'no-debugger': 'off',
    'no-param-reassign': 'off',
    'no-plusplus': 'off',
    'no-underscore-dangle': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '(state|dispatch)' }],
    'no-unused-expressions': 'off',
    'react/destructuring-assignment': 'off',
    'react/forbid-prop-types': 'off',
    'react-hooks/exhaustive-deps': 'error',
    'react/jsx-filename-extension': 'off',
    'react/jsx-no-bind': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/no-find-dom-node': 'off',
    'react/no-string-refs': 'off',
    'react/no-unused-prop-types': 'warn',
    'react/prefer-stateless-function': [
      'error',
      { ignorePureComponents: true },
    ],
    'react/sort-comp': 'off',
  },
};
