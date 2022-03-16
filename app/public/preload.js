const path = require('path');

const fs = require('fs');

const electron = require('electron');

const os = require('os');

const { platform } = os;

const { remote, shell, ipcRenderer, clipboard, webFrame } = electron;
const { app, dialog } = remote;
const { spawn } = require('child_process');

const version = remote.app.getVersion();

const adb = require('@devicefarmer/adbkit').Adb;

const forwarder = {
  proc: null,
  output: '',
};

let adbPath = '';
let xcrunPath = '';

const getPlatform = () => {
  switch (platform()) {
    case 'aix':
    case 'freebsd':
    case 'linux':
    case 'openbsd':
    case 'android':
      return 'linux';
    case 'darwin':
    case 'sunos':
      return 'mac';
    case 'win32':
    case 'win64':
      return 'win';
    default:
      throw new Error();
  }
};

const DEFAULT_BINARY_SEARCH_PATHS = ['/usr/bin', '/usr/local/bin', '/opt/bin'];

const IS_WINDOWS = getPlatform() === 'win';
const IS_MACOS = getPlatform() === 'mac';

/*
 * utilities for resolving embedded binaries
 */

const getPathToBinary = (name) => {
  const resolvedName = IS_WINDOWS ? `${name}.exe` : name;
  const root = process.cwd();
  const { isPackaged, getAppPath } = remote.app;
  const binariesPath = isPackaged
    ? path.join(path.dirname(getAppPath()), '..', './Resources', './bin')
    : path.join(root, './resources', getPlatform(), './bin');
  const fn = path.resolve(path.join(binariesPath, `./${resolvedName}`));
  return fs.existsSync(fn) && fn;
};

/*
 * begin gross code to locate adb
 */

const execute = (...args) =>
  new Promise((resolve, reject) => {
    const command = spawn(...args);
    let result = '';
    let err = false;
    command.stdout.on('data', (data) => {
      result += data.toString();
    });
    command.stderr.on('data', (data) => {
      result += data.toString();
      err = true;
    });
    command.on('close', () => (err ? reject(result) : resolve(result)));
    command.on('error', (ex) => reject(ex));
  });

const getDefaultAdbPath = () => {
  if (IS_MACOS) {
    const defaultPath = `${global.ipc.env.getPath(
      'home'
    )}/Library/Android/sdk/platform-tools/adb`;
    if (fs.existsSync(defaultPath)) {
      return defaultPath;
    }
  } else if (IS_WINDOWS) {
    return getPathToBinary('adb');
  }
  return null;
};

const findDefaultPaths = async () => [
  ...DEFAULT_BINARY_SEARCH_PATHS,
  ...process.env.PATH.split(':'),
];

const findAdb = async () => {
  if (adbPath) {
    return adbPath;
  }
  const defaultPath = getDefaultAdbPath();
  if (defaultPath) {
    adbPath = defaultPath;
  }
  if (!adbPath) {
    const defaultPaths = await findDefaultPaths();
    defaultPaths.forEach((dir) => {
      if (!adbPath && fs.existsSync(`${dir}/adb`)) {
        adbPath = `${dir}/adb`;
      }
    });
  }
  return adbPath || (IS_WINDOWS ? 'adb.exe' : 'adb');
};

const findXcrun = async () => {
  if (xcrunPath) {
    return xcrunPath;
  }
  const defaultPaths = await findDefaultPaths();
  defaultPaths.forEach((dir) => {
    if (!xcrunPath && fs.existsSync(`${dir}/xcrun`)) {
      xcrunPath = `${dir}/xcrun`;
    }
  });
  return xcrunPath;
};

process.on('exit', () => {
  if (forwarder.proc) {
    forwarder.proc.kill();
    forwarder.proc = null;
    forwarder.output = '';
    forwarder.error = '';
  }
});

global.ipc = {
  ...(global.ipc || {}),

  adbkit: adb,

  events: {
    on: (name, ...args) => {
      console.log('[preload] event registered:', name);
      ipcRenderer.on(name, ...args);
    },
    off: (name, ...args) => {
      console.log('[preload] event unregistered:', name);
      ipcRenderer.off(name, ...args);
    },
    emit: (...args) => ipcRenderer.send(...args),
    send: (...args) => ipcRenderer.send(...args),
    sendSync: (...args) => ipcRenderer.sendSync(...args),
  },

  zoom: {
    inc: () => webFrame.setZoomFactor(webFrame.getZoomFactor() + 0.1),
    dec: () => webFrame.setZoomFactor(webFrame.getZoomFactor() - 0.1),
    reset: () => webFrame.setZoomFactor(1.0),
  },

  env: {
    getPath: (name) => app.getPath(name),
  },

  status: {
    version,
  },

  shell: {
    openExternal: (...args) => shell.openExternal(...args),
  },

  deepLink: {
    routeAndroid: async (uri, args) => {
      const adbBinary = await findAdb();
      if (adbBinary) {
        const proc = spawn(adbBinary, [
          ...(args || []),
          'shell',
          'am',
          'start',
          '-a',
          'android.intent.action.VIEW',
          '-d',
          uri.replace('&', '\\&') /* ampersands must be escaped */,
        ]);
        if (proc) {
          return proc.stdout;
        }
      }
      return null;
    },
    routeIos: async (uri) => {
      const xcrunBinary = await findXcrun();
      if (xcrunBinary) {
        const proc = spawn(xcrunBinary, ['simctl', 'openurl', 'booted', uri]);
        if (proc) {
          return proc.stdout;
        }
      }
      return null;
    },
  },

  forwarder: {
    isAvailable: () => IS_MACOS,
    isRunning: () => !!forwarder.proc,
    start: (ports) =>
      /* eslint-disable-next-line */
      new Promise(async (resolve) => {
        if (!IS_MACOS) {
          resolve(false);
          return;
        }
        if (!forwarder.proc) {
          try {
            await execute('killall', ['-9', 'forwarder']);
          } catch (e) {
            console.log(
              '[forwarder] failed to kill other forwarders (or no other instances running)'
            );
          }
          const pathToBinary = getPathToBinary('forwarder');
          if (fs.existsSync(pathToBinary)) {
            const args = `--ports=${Object.keys(ports)
              .map((k) => `${k}:${ports[k]}`)
              .join(',')}`;
            const proc = spawn(pathToBinary, [args]);
            if (proc) {
              proc.stdout.on('data', (data) => {
                if (forwarder.proc === proc) {
                  forwarder.output += data.toString();
                  console.log(`[forwarder stdout] ${data}`);
                }
              });
              proc.stderr.on('data', (data) => {
                if (forwarder.proc === proc) {
                  forwarder.error += `[stderr] ${data.toString()}`;
                  console.log(`[forwarder stderr] ${data}`);
                }
              });
              proc.on('exit', () => {
                if (forwarder.proc === proc) {
                  forwarder.proc = null;
                  forwarder.output = '';
                  forwarder.error = '';
                  ipcRenderer.emit('/forwarder/stopped');
                }
              });
              forwarder.proc = proc;
              ipcRenderer.emit('/forwarder/started');
              resolve(true);
              return;
            }
          }
        }
        resolve(false);
      }),
    stop: () => {
      if (forwarder.proc) {
        if (!forwarder.proc.killed) {
          forwarder.proc.kill('SIGTERM');
        }
      }
    },
    restart: () => {
      this.stop();
      this.start();
    },
    getOutput: () => ({ stdout: forwarder.output, stderr: forwarder.error }),
  },

  fs: {
    existsSync: (...args) => fs.existsSync(...args),
    readFileSync: (...args) => fs.readFileSync(...args),
    writeFileSync: (...args) => fs.writeFileSync(...args),
    mkdirSync: (...args) => fs.mkdirSync(...args),
  },

  path: {
    parse: (...args) => path.parse(...args),
    normalize: (...args) => path.normalize(...args),
    dirname: (...args) => path.dirname(...args),
  },

  android: {
    readLogcat: async (deviceId) => {
      const adbBinary = await findAdb();
      const proc = spawn(adbBinary, ['-s', deviceId, 'logcat', '-d']);
      if (proc) {
        return proc.stdout;
      }
      return null;
    },
    reverseRemoveAll: async (deviceId) => {
      spawn(await findAdb(), ['-s', deviceId, 'reverse', '--remove-all']);
    },
    startAdb: async () => {
      const resolvedAdb = await findAdb();
      if (resolvedAdb) {
        try {
          const options = {
            cwd: path.parse(resolvedAdb).dir,
          };
          await execute(`${resolvedAdb}`, ['start-server'], options);
          return true;
        } catch (e) {
          if (e && e.indexOf('daemon started successfully') >= 0) {
            return true;
          }
          console.error('failed to start adb', e);
        }
      }
      return false;
    },
    restartAdb: async () => {
      const resolvedAdb = await findAdb();
      if (resolvedAdb) {
        try {
          const options = {
            cwd: path.parse(resolvedAdb).dir,
          };
          try {
            await execute(`${resolvedAdb}`, ['kill-server'], options);
          } catch (e) {
            console.warn('failed to kill adb', e);
          }
          await execute(`${resolvedAdb}`, ['start-server'], options);
          return true;
        } catch (e) {
          if (e && e.indexOf('daemon started successfully') >= 0) {
            return true;
          }
          console.error('failed to restart adb', e);
        }
      }
      return false;
    },
  },

  io: {
    streamToFile: (stream, filename) => {
      const out = fs.createWriteStream(filename);
      stream.pipe(out);
    },
  },

  dialog: {
    save: (...args) => dialog.showSaveDialog(...args),
    open: (...args) => dialog.showOpenDialog(...args),
  },

  clipboard: {
    write: (text) => clipboard.writeText(text),
    pasteAndroid: async (text, args) => {
      const adbBinary = await findAdb();
      if (adbBinary) {
        const proc = spawn(adbBinary, [
          ...(args || []),
          'shell',
          'input',
          'text',
          text,
        ]);
        if (proc) {
          return proc.stdout;
        }
      }
      return null;
    },
  },

  mainWindow: {
    maximize: () => {
      const currentWindow = remote.getCurrentWindow();
      currentWindow.maximize();
    },
    minimize: () => {
      const currentWindow = remote.getCurrentWindow();
      currentWindow.minimize();
    },
    restore: () => {
      const currentWindow = remote.getCurrentWindow();
      if (currentWindow.isMaximized()) {
        currentWindow.unmaximize();
      } else {
        currentWindow.maximize();
      }
    },
    close: () => {
      const currentWindow = remote.getCurrentWindow();
      currentWindow.close();
    },
  },
};
