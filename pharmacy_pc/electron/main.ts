import { app, BrowserWindow, dialog, shell, ipcMain, nativeImage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, fork, ChildProcess } from 'node:child_process';
import fs from 'node:fs';

// Set Application User Model ID on Windows for custom taskbar icon & notifications
if (process.platform === 'win32') {
  app.setAppUserModelId('com.davasetu.pharmacypc');
}

// Disable hardware acceleration to prevent white screen and crashes on some Windows systems
app.disableHardwareAcceleration();

// Enable Chromium BarcodeDetector and camera platform features
app.commandLine.appendSwitch('enable-experimental-web-platform-features');

// Handle IPC to open external URLs (WhatsApp, browser)
ipcMain.handle('open-external', async (_event, url: string) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('whatsapp://'))) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

// Get available system printers (USB, Thermal POS, Network, Virtual)
ipcMain.handle('get-printers', async () => {
  try {
    if (!win || win.isDestroyed()) return [];
    return await win.webContents.getPrintersAsync();
  } catch (err: any) {
    console.error('Failed to get printers:', err);
    return [];
  }
});

// Silent thermal / document printing directly to hardware without OS dialog
ipcMain.handle('print-silent', async (_event, {
  html,
  printerName,
  silent = true,
  widthType = '80MM'
}: {
  html: string;
  printerName?: string;
  silent?: boolean;
  widthType?: '58MM' | '80MM' | 'A4';
}) => {
  return new Promise((resolve) => {
    let printWin: BrowserWindow | null = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    let resolved = false;
    const finish = (result: { success: boolean; error?: string }) => {
      if (resolved) return;
      resolved = true;
      if (printWin && !printWin.isDestroyed()) {
        printWin.destroy();
        printWin = null;
      }
      resolve(result);
    };

    // Failsafe timeout
    const timeout = setTimeout(() => {
      finish({ success: false, error: 'Hardware printing timed out' });
    }, 12000);

    printWin.webContents.on('did-finish-load', () => {
      if (!printWin || printWin.isDestroyed()) return;

      const printOptions: any = {
        silent: silent ?? true,
        printBackground: true,
        margins: { marginType: 'none' },
      };

      if (printerName && printerName.trim().length > 0) {
        printOptions.deviceName = printerName.trim();
      }

      // POS Thermal continuous roll sizing or standard sheet
      if (widthType === '58MM') {
        printOptions.pageSize = { width: 58000, height: 250000 };
      } else if (widthType === '80MM') {
        printOptions.pageSize = { width: 80000, height: 300000 };
      } else {
        printOptions.pageSize = 'A4';
      }

      printWin.webContents.print(printOptions, (success, failureReason) => {
        clearTimeout(timeout);
        finish({ success, error: failureReason || undefined });
      });
    });

    printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  });
});

process.on('uncaughtException', (error) => {
  dialog.showErrorBox('App Crash (Uncaught Exception)', error.message + '\n' + (error.stack || ''));
});

process.on('unhandledRejection', (reason) => {
  dialog.showErrorBox('App Crash (Unhandled Rejection)', String(reason));
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const APP_ROOT = path.join(__dirname, '..');
process.env.APP_ROOT = APP_ROOT;

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;
function createWindow() {
  try {
    const publicDir = process.env.VITE_PUBLIC || path.join(APP_ROOT, 'public');
    const iconPath = path.join(publicDir, 'icon.png');
    const appIcon = nativeImage.createFromPath(iconPath);

    win = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: appIcon.isEmpty() ? iconPath : appIcon,
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    if (!appIcon.isEmpty()) {
      win.setIcon(appIcon);
    }

    // Automatically grant media permissions (webcam) for barcode scanner in Electron
    win.webContents.session.setPermissionRequestHandler((_webContents, permission, callback) => {
      if (permission === 'media') {
        callback(true);
        return;
      }
      callback(true);
    });

    win.webContents.session.setPermissionCheckHandler((_webContents, permission) => {
      if (permission === 'media') {
        return true;
      }
      return true;
    });

    // Handle external links (e.g. WhatsApp, external docs) in the system default browser
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('whatsapp:')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
      return { action: 'allow' };
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
  createWindow();
});

