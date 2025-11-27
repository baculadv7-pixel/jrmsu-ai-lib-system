// JRMSU AI-Library System - Electron main process
// This file is designed to RECYCLE the existing web app builds from
// `jrmsu-wise-library-main/dist` and `mirror-login-page/dist`.
//
// When you change React code in those projects, just rebuild with
// `npm run build` and restart this Electron app.

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let mirrorWindow = null;
let backendProcess = null;

function resolveDist(relativePath) {
  // Helper to resolve dist paths relative to the desktop-app folder
  return path.join(__dirname, '..', relativePath);
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#00224A',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const mainIndex = resolveDist('jrmsu-wise-library-main/dist/index.html');
  mainWindow.loadFile(mainIndex).catch((err) => {
    console.error('[Electron] Failed to load main index.html:', err);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMirrorWindow() {
  if (mirrorWindow && !mirrorWindow.isDestroyed()) {
    mirrorWindow.focus();
    return;
  }

  mirrorWindow = new BrowserWindow({
    width: 1024,
    height: 640,
    minWidth: 800,
    minHeight: 500,
    backgroundColor: '#00224A',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const mirrorIndex = resolveDist('mirror-login-page/dist/index.html');
  mirrorWindow.loadFile(mirrorIndex).catch((err) => {
    console.error('[Electron] Failed to load mirror index.html:', err);
  });

  mirrorWindow.on('closed', () => {
    mirrorWindow = null;
  });
}

function createMenu() {
  const template = [
    {
      label: 'JRMSU AI-Library',
      submenu: [
        {
          label: 'Main System',
          click: () => createMainWindow(),
        },
        {
          label: 'Mirror Login Page',
          click: () => createMirrorWindow(),
        },
        { type: 'separator' },
        {
          label: 'Reload',
          role: 'reload',
        },
        {
          label: 'Toggle DevTools',
          role: 'toggleDevTools',
        },
        { type: 'separator' },
        {
          label: 'Quit',
          role: 'quit',
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function startBackend() {
  if (backendProcess) return;

  const backendPath = path.join(__dirname, '..', 'jrmsu-wise-library-main', 'python-backend');

  // NOTE: This assumes `python` is on PATH and `app.py` is the main backend entry point.
  backendProcess = spawn('python', ['app.py'], {
    cwd: backendPath,
    shell: true,
  });

  backendProcess.stdout.on('data', (data) => {
    console.log('[backend]', data.toString().trim());
  });

  backendProcess.stderr.on('data', (data) => {
    console.error('[backend]', data.toString().trim());
  });

  backendProcess.on('close', (code) => {
    console.log(`[backend] exited with code ${code}`);
    backendProcess = null;
  });
}

function stopBackend() {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (e) {
      console.error('[backend] failed to kill process:', e);
    }
    backendProcess = null;
  }
}

app.whenReady().then(() => {
  // Optional: comment this out if you prefer to start backend manually.
  startBackend();

  createMainWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});
