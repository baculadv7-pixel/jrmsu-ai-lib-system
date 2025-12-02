// JRMSU AI-Library System - Electron main process (DesktopappLibrary)
// This file RECYCLES the existing web app builds from
// `jrmsu-wise-library-main/dist` and `mirror-login-page/dist`.
//
// When you change React code in those projects, rebuild them with
// `npm run build` and restart this Electron app.

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const express = require('express');

let mainWindow = null;
let mirrorWindow = null;
let backendProcess = null;
let mainStaticServer = null;
let mirrorStaticServer = null;

const MAIN_STATIC_PORT = 4173;
const MIRROR_STATIC_PORT = 4174;

function resolveDist(relativePath) {
  // Helper to resolve dist paths relative to the DesktopappLibrary folder
  // Example: resolveDist('jrmsu-wise-library-main/dist/index.html')
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

  const mainUrl = `http://localhost:${MAIN_STATIC_PORT}/`;
  mainWindow.loadURL(mainUrl).catch((err) => {
    console.error('[Electron] Failed to load main app URL:', err);
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

  const mirrorUrl = `http://localhost:${MIRROR_STATIC_PORT}/`;
  mirrorWindow.loadURL(mirrorUrl).catch((err) => {
    console.error('[Electron] Failed to load mirror app URL:', err);
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

function checkBackendRunning(timeoutMs = 2000) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        host: 'localhost',
        port: 5000,
        path: '/health',
        timeout: timeoutMs,
      },
      (res) => {
        // If backend responds with 200, assume it is already running.
        const ok = res.statusCode === 200;
        res.destroy();
        resolve(ok);
      },
    );

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
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

function startStaticServers() {
  if (!mainStaticServer) {
    const appMain = express();
    const mainDist = resolveDist('jrmsu-wise-library-main/dist');
    appMain.use(express.static(mainDist));
    // SPA fallback: always serve index.html for unknown routes so
    // React Router can handle /register, /students, /admins, etc.
    appMain.get('*', (_req, res) => {
      res.sendFile(path.join(mainDist, 'index.html'));
    });
    mainStaticServer = appMain.listen(MAIN_STATIC_PORT, () => {
      console.log(`[static] Main frontend served at http://localhost:${MAIN_STATIC_PORT}/ from ${mainDist}`);
    });
  }

  if (!mirrorStaticServer) {
    const appMirror = express();
    const mirrorDist = resolveDist('mirror-login-page/dist');
    appMirror.use(express.static(mirrorDist));
    // SPA fallback for mirror login routes as well.
    appMirror.get('*', (_req, res) => {
      res.sendFile(path.join(mirrorDist, 'index.html'));
    });
    mirrorStaticServer = appMirror.listen(MIRROR_STATIC_PORT, () => {
      console.log(`[static] Mirror frontend served at http://localhost:${MIRROR_STATIC_PORT}/ from ${mirrorDist}`);
    });
  }
}

async function initApp() {
  try {
    // Start static servers that serve the built frontends over HTTP.
    startStaticServers();

    const alreadyRunning = await checkBackendRunning();
    if (alreadyRunning) {
      console.log('[backend] Detected existing backend at http://localhost:5000, will not start a new one.');
    } else {
      startBackend();
    }
  } catch (e) {
    console.error('[backend] backend health check failed, attempting to start backend anyway:', e);
    startBackend();
  }

  createMainWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
}

app.whenReady().then(() => {
  initApp().catch((e) => {
    console.error('[Electron] initApp failed:', e);
    createMainWindow();
    createMenu();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
  try {
    if (mainStaticServer) {
      mainStaticServer.close();
      mainStaticServer = null;
    }
    if (mirrorStaticServer) {
      mirrorStaticServer.close();
      mirrorStaticServer = null;
    }
  } catch (e) {
    console.error('[static] failed to stop static servers:', e);
  }
});
