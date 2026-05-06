/// <reference types="node" />

import type { Server as HttpServer } from 'http';
import {
  handleVowelCommand,
  handleEmotionCommand,
  handleSpeakCommand,
  handleAnimationCommand,
} from './ipcHandlers';
import { validateVowel, validateEmotion, validateSpeakPayload, validateAnimationPayload } from './validation';

const http = require('http');

const HTTP_PORT = 3939;
let httpServer: HttpServer | null = null;

export function startHttpServer(): void {
  httpServer = http.createServer((req: any, res: any) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (req.method === 'POST') {
      const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB
      let body = '';
      let size = 0;
      req.on('data', (chunk: any) => {
        size += chunk.length;
        if (size > MAX_PAYLOAD_SIZE) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payload too large' }));
          req.destroy();
          return;
        }
        body += chunk.toString();
      });

      req.on('end', () => {
        if (res.headersSent) return;
        try {
          const data = JSON.parse(body);

          if (req.url === '/vrm/vowel') {
            if (!validateVowel(data.vowel)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid vowel value' }));
              return;
            }
            handleVowelCommand(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } else if (req.url === '/vrm/emotion') {
            if (!validateEmotion(data.emotion)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid emotion value' }));
              return;
            }
            handleEmotionCommand(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } else if (req.url === '/vrm/speak') {
            if (!validateSpeakPayload(data)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'text must be a string' }));
              return;
            }
            handleSpeakCommand(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } else if (req.url === '/vrm/animation') {
            if (!validateAnimationPayload(data)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'animation must be a string' }));
              return;
            }
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

export function closeHttpServer(): void {
  if (httpServer) {
    httpServer.close();
  }
}
