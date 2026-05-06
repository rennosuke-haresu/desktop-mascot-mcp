import { describe, it, expect } from 'vitest';
import {
  TtsError,
  createNetworkError,
  createApiError,
  createTimeoutError,
  createPlaybackError,
  wrapError,
} from '../utils/errors.js';
import { ErrorType } from '../types/index.js';

describe('TtsError', () => {
  it('canRetry() は retryable: true のとき true を返す', () => {
    const err = new TtsError({ type: ErrorType.NETWORK, message: 'test', retryable: true });
    expect(err.canRetry()).toBe(true);
  });

  it('canRetry() は retryable: false のとき false を返す', () => {
    const err = new TtsError({ type: ErrorType.PLAYBACK, message: 'test', retryable: false });
    expect(err.canRetry()).toBe(false);
  });

  it('toString() は retryable のとき "(retryable)" サフィックスを含む', () => {
    const err = new TtsError({ type: ErrorType.NETWORK, message: 'msg', retryable: true });
    expect(err.toString()).toBe('[NETWORK] msg (retryable)');
  });

  it('toString() は non-retryable のときサフィックスなし', () => {
    const err = new TtsError({ type: ErrorType.PLAYBACK, message: 'msg', retryable: false });
    expect(err.toString()).toBe('[PLAYBACK] msg');
  });

  it('name は "TtsError"', () => {
    const err = new TtsError({ type: ErrorType.UNKNOWN, message: 'test', retryable: false });
    expect(err.name).toBe('TtsError');
  });
});

describe('createNetworkError', () => {
  it('retryable: true、type: NETWORK', () => {
    const err = createNetworkError('connection failed');
    expect(err.retryable).toBe(true);
    expect(err.type).toBe(ErrorType.NETWORK);
  });
});

describe('createApiError', () => {
  it('500 は retryable', () => {
    const err = createApiError(500, 'server error');
    expect(err.retryable).toBe(true);
  });

  it('503 は retryable', () => {
    const err = createApiError(503, 'unavailable');
    expect(err.retryable).toBe(true);
  });

  it('400 は non-retryable', () => {
    const err = createApiError(400, 'bad request');
    expect(err.retryable).toBe(false);
  });
});

describe('createTimeoutError', () => {
  it('retryable: true、type: TIMEOUT、メッセージに "5000ms" を含む', () => {
    const err = createTimeoutError(5000);
    expect(err.retryable).toBe(true);
    expect(err.type).toBe(ErrorType.TIMEOUT);
    expect(err.message).toContain('5000ms');
  });
});

describe('createPlaybackError', () => {
  it('retryable: false、type: PLAYBACK', () => {
    const err = createPlaybackError('file not found');
    expect(err.retryable).toBe(false);
    expect(err.type).toBe(ErrorType.PLAYBACK);
  });
});

describe('wrapError', () => {
  it('TtsError はそのままのインスタンスを返す', () => {
    const original = createNetworkError('test');
    expect(wrapError(original)).toBe(original);
  });

  it('fetch TypeError は NETWORK エラーとしてラップ', () => {
    const typeErr = new TypeError('fetch failed');
    const wrapped = wrapError(typeErr);
    expect(wrapped.type).toBe(ErrorType.NETWORK);
  });

  it('不明な Error は UNKNOWN エラーとしてラップ', () => {
    const err = new Error('something went wrong');
    const wrapped = wrapError(err);
    expect(wrapped.type).toBe(ErrorType.UNKNOWN);
  });
});
