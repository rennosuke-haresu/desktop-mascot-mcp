import { ErrorType, AivisSpeechErrorData } from '../types/index.js';

/**
 * AivisSpeech専用エラークラス
 */
export class AivisSpeechError extends Error {
  public readonly type: ErrorType;
  public readonly retryable: boolean;
  public readonly originalError?: unknown;

  constructor(data: AivisSpeechErrorData) {
    super(data.message);
    this.name = 'AivisSpeechError';
    this.type = data.type;
    this.retryable = data.retryable;
    this.originalError = data.originalError;

    // スタックトレースを適切に設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AivisSpeechError);
    }
  }

  /**
   * エラーが再試行可能かどうかを判定
   */
  public canRetry(): boolean {
    return this.retryable;
  }

  /**
   * エラー情報を文字列化
   */
  public toString(): string {
    return `[${this.type}] ${this.message}${this.retryable ? ' (再試行可能)' : ''}`;
  }
}

/**
 * ネットワークエラーを作成
 */
export function createNetworkError(message: string, originalError?: unknown): AivisSpeechError {
  return new AivisSpeechError({
    type: ErrorType.NETWORK,
    message: `ネットワークエラー: ${message}`,
    originalError,
    retryable: true,
  });
}

/**
 * APIエラーを作成
 */
export function createApiError(status: number, message: string): AivisSpeechError {
  const retryable = status >= 500 && status < 600; // 5xxエラーは再試行可能
  return new AivisSpeechError({
    type: ErrorType.API,
    message: `APIエラー (${status}): ${message}`,
    retryable,
  });
}

/**
 * タイムアウトエラーを作成
 */
export function createTimeoutError(timeoutMs: number): AivisSpeechError {
  return new AivisSpeechError({
    type: ErrorType.TIMEOUT,
    message: `タイムアウト: ${timeoutMs}ms以内に応答がありませんでした`,
    retryable: true,
  });
}

/**
 * 再生エラーを作成
 */
export function createPlaybackError(message: string, originalError?: unknown): AivisSpeechError {
  return new AivisSpeechError({
    type: ErrorType.PLAYBACK,
    message: `再生エラー: ${message}`,
    originalError,
    retryable: false,
  });
}

/**
 * 不明なエラーを作成
 */
export function createUnknownError(originalError: unknown): AivisSpeechError {
  const message = originalError instanceof Error ? originalError.message : String(originalError);
  return new AivisSpeechError({
    type: ErrorType.UNKNOWN,
    message: `不明なエラー: ${message}`,
    originalError,
    retryable: false,
  });
}

/**
 * エラーから適切なAivisSpeechErrorを生成
 */
export function wrapError(error: unknown): AivisSpeechError {
  if (error instanceof AivisSpeechError) {
    return error;
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createNetworkError('AivisSpeech APIに接続できません', error);
  }

  return createUnknownError(error);
}
