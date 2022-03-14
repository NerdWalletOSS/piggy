import React from 'react';
import { GlobalHotKeys } from 'react-hotkeys';
import { setStyleDecorator } from 'react-json-view';
import styleDecorator from '@lib/ReactJsonStyleDecorator';
import { BackendContextProvider } from './BackendContext';
import './App.css';
import './SplitterLayout.css';
import MainWindow from './MainWindow';

setStyleDecorator(styleDecorator);

const KEY_MAP = {
  ZOOM_IN: ['command+=', 'ctrl+='],
  ZOOM_OUT: ['command+-', 'ctrl+-'],
  ZOOM_RESET: ['command+0', 'ctrl+0'],
};

const KEY_HANDLERS = {
  ZOOM_IN: () => global.ipc.zoom.inc(),
  ZOOM_OUT: () => global.ipc.zoom.dec(),
  ZOOM_RESET: () => global.ipc.zoom.reset(),
};

export default () => (
  <GlobalHotKeys keyMap={KEY_MAP} handlers={KEY_HANDLERS}>
    <BackendContextProvider>
      <MainWindow />
    </BackendContextProvider>
  </GlobalHotKeys>
);
