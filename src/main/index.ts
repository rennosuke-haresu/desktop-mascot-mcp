/// <reference types="node" />

const { app, BrowserWindow } = require('electron');
import { createWindow, isRecreating } from './window';
import { startHttpServer, closeHttpServer } from './httpServer';
import { registerIpcHandlers } from './ipcHandlers';

app.on('window-all-closed', () => {
  // ウィンドウ再作成中は終了しない
  if (isRecreating()) return;

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(() => {
  createWindow();
  startHttpServer();
  registerIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cleanup on quit
app.on('before-quit', () => {
  closeHttpServer();
});

console.error('Desktop Mascot VRM Window started');
