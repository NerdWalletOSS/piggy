const electron = require('electron');

const { app, shell, BrowserWindow, Menu, ipcMain, MenuItem } = electron;
const isDev = require('electron-is-dev');
const defaultMenu = require('electron-default-menu');
const path = require('path');
const url = require('url');
const server = require('./server');

let mainWindow; /* keep global reference; otherwise gc will close window */
let serverStarted = false;

function sendIpcEvent(name, message) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send(name, message || {});
  }
}

function startServer() {
  if (serverStarted) {
    return;
  }

  server.start();

  ipcMain.on('/server/connected', () => {
    serverStarted = true;
    sendIpcEvent('/server/connected');
  });

  ipcMain.on('/session/get', (requestId) => {
    sendIpcEvent('/session/get', requestId);
  });

  ipcMain.on('/server/disconnected', () => {
    serverStarted = false;
    sendIpcEvent('/server/disconnected');
  });

  ipcMain.on('/client/connected', (client) => {
    sendIpcEvent('/client/connected', client);
  });

  ipcMain.on('/client/disconnected', (client) => {
    serverStarted = true;
    sendIpcEvent('/client/disconnected', client);
  });

  ipcMain.on('/ws/recv', (message) => {
    const name = message.name[0] === '/' ? message.name : `/${message.name}`;
    sendIpcEvent(`/ws/recv${name}`, message);
  });
}

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
    startServer();
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
