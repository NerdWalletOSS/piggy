const electron = require('electron');

const { app, shell, BrowserWindow, Menu, ipcMain, MenuItem } = electron;
const isDev = require('electron-is-dev');
const defaultMenu = require('electron-default-menu');
const path = require('path');
const url = require('url');
const server = require('./server');

let mainWindow; /* keep global reference; otherwise gc will close window */

const ipcProxy = {
  emitToRenderer: (...args) => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send(...args);
    } else {
      console.log('ipcProxy: mainWindow not ready');
    }
  },
  onceRenderer: (...args) => {
    ipcMain.once(...args);
  },
  onRenderer: (...args) => {
    ipcMain.on(...args);
  },
  offRenderer: (...args) => {
    ipcMain.off(...args);
  },
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false,
    backgroundColor: '#272727',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      enableRemoteModule: true,
      contextIsolation: false,
      /* enabled so plugins can make HTTP requests and not worry
      about CORS issues. this is currently used to embed the Hermes
      debugger via Metro bundler, which does not currently set CORS
      headers. (note: Flipper does the same thing) */
      webSecurity: false,
      /* for WebView support; used to render Hermes debugger */
      webviewTag: true,
    },
  });

  const appUrl = isDev
    ? 'http://localhost:3000'
    : url.format({
        pathname: path.join(__dirname, '/../build/index.html'),
        protocol: 'file:',
        slashes: true,
      });

  mainWindow.loadURL(appUrl);

  mainWindow.on('closed', () => {
    mainWindow = null; /* ok to gc */
  });

  mainWindow.webContents.on('did-finish-load', () => {
    server.init(ipcProxy);
    server.start();
  });

  // Devtools for working on the devtool itself
  if (isDev) {
    let rightClickPosition;
    const contextMenu = new Menu();
    const inspectElement = new MenuItem({
      label: 'Inspect Element',
      click: () => {
        mainWindow.webContents.inspectElement(
          rightClickPosition.x,
          rightClickPosition.y
        );
      },
    });
    const openDevTools = new MenuItem({
      label: 'Open Developer Tools',
      click: () => {
        mainWindow.webContents.openDevTools();
      },
    });
    contextMenu.append(inspectElement);
    contextMenu.append(openDevTools);

    mainWindow.webContents.on('context-menu', (event, params) => {
      rightClickPosition = { x: params.x, y: params.y };
      contextMenu.popup();
    });
  }
}

function startApp() {
  if (isDev) {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS,
    } = require('electron-devtools-installer');
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err));
  }

  createWindow();
  /* this allows default accelerators like copy/paste/select all
  to work as expected in release mode */
  Menu.setApplicationMenu(Menu.buildFromTemplate(defaultMenu(app, shell)));
}

app.on('ready', startApp);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
