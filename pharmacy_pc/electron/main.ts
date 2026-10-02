import { app, BrowserWindow, dialog } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, ChildProcess } from 'node:child_process';

// Disable hardware acceleration to prevent white screen and crashes on some Windows systems
app.disableHardwareAcceleration();

process.on('uncaughtException', (error) => {
  dialog.showErrorBox('App Crash (Uncaught Exception)', error.message + '\n' + (error.stack || ''));
});

process.on('unhandledRejection', (reason) => {
  dialog.showErrorBox('App Crash (Unhandled Rejection)', String(reason));
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;
let backendProcess: ChildProcess | null = null;

function startBackend() {
  const isDev = !!process.env['VITE_DEV_SERVER_URL'];
  const backendPath = path.join(process.env.APP_ROOT as string, '..', 'backend');
  
  try {
    if (isDev) {
      backendProcess = spawn('npm.cmd', ['run', 'dev'], {
        cwd: backendPath,
        shell: true,
      });
    } else {
      backendProcess = spawn('node', ['dist/server.js'], {
        cwd: backendPath,
        shell: true,
      });
    }

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend server:', err);
    });
  } catch (error) {
    console.error('Error starting backend:', error);
  }
}

function createWindow() {
  try {
    win = new BrowserWindow({
      width: 1200,
      height: 800,
      // icon: path.join(process.env.VITE_PUBLIC || '', 'davasetu_logo.png'), // Removed to prevent asar path crash on Windows
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    if (VITE_DEV_SERVER_URL) {
      win.loadURL(VITE_DEV_SERVER_URL);
    } else {
      win.loadFile(path.join(RENDERER_DIST, 'index.html'));
    }
  } catch (error: any) {
    dialog.showErrorBox('App Crash (createWindow)', error?.message || String(error));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
