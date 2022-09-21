/* eslint-disable import/no-import-module-exports */
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { initializePlugins } from '@plugins';
import App from './App/App';

initializePlugins();

ReactDOM.render(<App />, document.getElementById('root'));

if (module.hot) {
  module.hot.accept();
}
