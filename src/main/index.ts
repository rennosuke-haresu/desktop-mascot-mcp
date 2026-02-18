/// <reference types="node" />

import type { BrowserWindow as BrowserWindowType } from 'electron';
import type { Server as HttpServer } from 'http';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');

// __dirname and __filename are automatically provided by Node.js in CommonJS

let mainWindow: BrowserWindowType | null = null;
let httpServer: HttpServer | null = null;
let isNormalMode = true; // true: デスクトップマスコット風, false: 設定モード
let isRecreatingWindow = false; // ウィンドウ再作成中フラグ

const HTTP_PORT = 3939;

function createWindow() {
  console.log(`[desktop-mascot-mcp] Creating window in ${isNormalMode ? 'Normal' : 'Settings'} mode`);
  console.log(`[desktop-mascot-mcp] Window settings - transparent: ${isNormalMode}, frame: ${!isNormalMode}, alwaysOnTop: ${isNormalMode}`);

  const preloadPath = path.join(__dirname, '../renderer/preload.js');

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    transparent: isNormalMode, // 通常モード: 透過, 設定モード: 不透明
    backgroundColor: isNormalMode ? '#00000000' : '#222222', // 通常モード: 完全透明, 設定モード: ダークグレー
    frame: !isNormalMode, // 通常モード: フレームなし, 設定モード: フレームあり
    resizable: true,
    alwaysOnTop: isNormalMode, // 通常モード: 最前面, 設定モード: 通常
    skipTaskbar: isNormalMode, // 通常モード: タスクバー非表示
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
  });

  // Ctrl+, でモード切り替え（フォーカス時のみ）
  mainWindow!.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === ',' && input.control) {
      event.preventDefault();
      toggleWindowMode();
    }
  });

  // Load VRM renderer HTML
  mainWindow!.loadFile(path.join(__dirname, '../renderer/VRM.html'));

  mainWindow!.on('closed', () => {
    mainWindow = null;
  });
}

// Toggle between normal mode (frameless transparent) and settings mode (with frame)
function toggleWindowMode() {
  if (!mainWindow) return;

  isNormalMode = !isNormalMode;
  console.log(`[desktop-mascot-mcp] Window mode switched to ${isNormalMode ? 'Normal' : 'Settings'}`);

  // Save current window position and size
  const [x, y] = mainWindow.getPosition();
  const [width, height] = mainWindow.getSize();

  // Set flag to prevent app quit during window recreation
  isRecreatingWindow = true;

  // Close current window
  mainWindow.close();

  // Wait for window to close, then recreate
  setTimeout(() => {
    createWindow();
    if (mainWindow) {
      mainWindow.setPosition(x, y);
      mainWindow.setSize(width, height);
    }
    isRecreatingWindow = false;
  }, 100);
}

app.on('window-all-closed', () => {
  // ウィンドウ再作成中は終了しない
  if (isRecreatingWindow) {
    return;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// HTTP server for MCP communication
function startHttpServer() {
  httpServer = http.createServer((req: any, res: any) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const data = JSON.parse(body);

          // Route to appropriate handler
          if (req.url === '/vrm/vowel') {
            handleVowelCommand(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } else if (req.url === '/vrm/emotion') {
            handleEmotionCommand(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } else if (req.url === '/vrm/speak') {
            handleSpeakCommand(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } else if (req.url === '/vrm/animation') {
            handleAnimationCommand(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
          }
        } catch (error) {
          console.error('HTTP request error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  });

  httpServer!.listen(HTTP_PORT, () => {
    console.log(`VRM control HTTP server listening on port ${HTTP_PORT}`);
  });
}

// Command handlers
function handleVowelCommand(data: { vowel: 'a' | 'i' | 'u' | 'e' | 'o' | null }) {
  if (mainWindow) {
    mainWindow.webContents.send('vrm-vowel', data.vowel);
  }
}

function handleEmotionCommand(data: { emotion: 'neutral' | 'happy' | 'angry' | 'sad' | 'relaxed' | 'surprised' }) {
  if (mainWindow) {
    mainWindow.webContents.send('vrm-emotion', data.emotion);
  }
}

function handleSpeakCommand(data: { text: string; emotion?: string }) {
  if (mainWindow) {
    mainWindow.webContents.send('vrm-speak', data);
  }
}

function handleAnimationCommand(data: { animation: string }) {
  if (mainWindow) {
    mainWindow.webContents.send('vrm-animation', data.animation);
  }
}

// Start HTTP server when app is ready
app.whenReady().then(() => {
  createWindow();
  startHttpServer();

  // IPC handler for window bounds
  ipcMain.on('set-window-bounds', (_event: any, bounds: { x: number; y: number; width: number; height: number }) => {
    if (mainWindow) {
      mainWindow.setBounds(bounds);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cleanup on quit
app.on('before-quit', () => {
  if (httpServer) {
    httpServer.close();
  }
});

console.error('Desktop Mascot VRM Window started');
