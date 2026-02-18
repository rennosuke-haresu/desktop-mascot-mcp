import { exec } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { promisify } from 'util';
import { AudioQuery, AivisSpeechConfig, Mora } from '../types/index.js';
import {
  createNetworkError,
  createApiError,
  createTimeoutError,
  createPlaybackError,
  wrapError,
  AivisSpeechError,
} from '../utils/errors.js';
import { VRMControlService } from './VRMControlService.js';

const execAsync = promisify(exec);

/**
 * リップシンクタイミング情報
 */
interface LipSyncTiming {
  vowel: 'a' | 'i' | 'u' | 'e' | 'o';
  startTime: number; // 秒単位
}

/**
 * AivisSpeech音声合成サービス
 */
export class AivisSpeechService {
  private readonly config: Required<AivisSpeechConfig>;
  private isProcessing = false; // 二重実行防止フラグ
  private vrmControl?: VRMControlService;

  constructor(config: AivisSpeechConfig, vrmControl?: VRMControlService) {
    this.config = {
      baseUrl: config.baseUrl,
      speakerId: config.speakerId,
      timeout: config.timeout ?? 30000, // デフォルト30秒
      maxRetries: config.maxRetries ?? 3, // デフォルト3回
      retryDelay: config.retryDelay ?? 1000, // デフォルト1秒
    };
    this.vrmControl = vrmControl;
  }

  /**
   * テキストを音声で再生（公開API）
   */
  public async speak(text: string): Promise<void> {
    if (this.isProcessing) {
      throw new Error('音声再生が既に実行中です。前の再生が完了するまでお待ちください。');
    }

    this.isProcessing = true;
    try {
      console.error(`[desktop-mascot-mcp] Speaking: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
      await this.speakWithRetry(text);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * リトライ機能付き音声再生
   */
  private async speakWithRetry(text: string): Promise<void> {
    let lastError: AivisSpeechError | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await this.speakInternal(text);
        return; // 成功したら終了
      } catch (error) {
        lastError = wrapError(error);

        // 再試行不可能なエラーの場合は即座に終了
        if (!lastError.canRetry()) {
          throw lastError;
        }

        // 最後の試行でない場合は待機してリトライ
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * attempt; // 指数バックオフ
          console.error(`[AivisSpeech] ${lastError.toString()} - ${delay}ms後に再試行 (${attempt}/${this.config.maxRetries})`);
          await this.sleep(delay);
        }
      }
    }

    // すべての試行が失敗した場合
    throw lastError!;
  }

  /**
   * 音声再生の内部実装
   */
  private async speakInternal(text: string): Promise<void> {
    // Step 1: 音声クエリを作成
    const query = await this.createAudioQuery(text);

    // Step 2: 音声を合成
    const audioBuffer = await this.synthesizeAudio(query);

    // Step 3: 音声の長さを計算（WAVヘッダーから）
    const audioDuration = this.calculateAudioDuration(audioBuffer, query);

    // Step 4: リップシンクタイミングを抽出（音声の長さを使用）
    const lipSyncTimings = this.extractLipSyncTimings(query, audioDuration);

    // Step 5: 音声を再生（リップシンク付き）
    await this.playAudioWithLipSync(audioBuffer, lipSyncTimings);
  }

  /**
   * WAVバッファから音声の長さ（秒）を計算
   */
  private calculateAudioDuration(audioBuffer: Buffer, query: AudioQuery): number {
    // WAVファイルのヘッダーサイズ（標準PCM WAV）
    const headerSize = 44;
    const dataSize = audioBuffer.length - headerSize;

    // サンプリングレートとチャンネル数を取得
    const sampleRate = query.outputSamplingRate;
    const channels = query.outputStereo ? 2 : 1;
    const bytesPerSample = 2; // 16-bit PCM

    // 音声の長さ（秒）を計算
    const duration = dataSize / (sampleRate * channels * bytesPerSample);
    return duration;
  }

  /**
   * AudioQueryから母音タイミング情報を抽出
   * 注: AivisSpeechではvowel_length/consonant_lengthが常に0なため、
   * 音声の総長さとモーラ数から均等分割で推定します
   */
  private extractLipSyncTimings(query: AudioQuery, audioDurationSeconds: number): LipSyncTiming[] {
    const timings: LipSyncTiming[] = [];

    // すべてのモーラを収集
    const allMoras: { vowel: string; text: string }[] = [];
    for (const phrase of query.accent_phrases) {
      for (const mora of phrase.moras) {
        if (mora.vowel && mora.vowel.length > 0) {
          allMoras.push({ vowel: mora.vowel, text: mora.text });
        }
      }
    }

    const moraCount = allMoras.length;
    if (moraCount === 0) {
      return timings;
    }

    // 音声の長さをモーラ数で均等分割
    const moraInterval = audioDurationSeconds / moraCount;

    // 各モーラの母音にタイミングを割り当て
    for (let i = 0; i < allMoras.length; i++) {
      const mora = allMoras[i];
      const vowel = mora.vowel.toLowerCase();

      if (vowel === 'a' || vowel === 'i' || vowel === 'u' || vowel === 'e' || vowel === 'o') {
        const startTime = i * moraInterval;
        timings.push({
          vowel: vowel as 'a' | 'i' | 'u' | 'e' | 'o',
          startTime: startTime,
        });
      }
    }

    return timings;
  }

  /**
   * 音声クエリを作成
   */
  private async createAudioQuery(text: string): Promise<AudioQuery> {
    const url = `${this.config.baseUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${this.config.speakerId}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw createApiError(response.status, `音声クエリの作成に失敗しました`);
      }

      return await response.json() as AudioQuery;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw createTimeoutError(this.config.timeout);
      }
      if (error instanceof AivisSpeechError) {
        throw error;
      }
      throw createNetworkError('音声クエリの作成中にエラーが発生しました', error);
    }
  }

  /**
   * 音声を合成
   */
  private async synthesizeAudio(query: AudioQuery): Promise<Buffer> {
    const url = `${this.config.baseUrl}/synthesis?speaker=${this.config.speakerId}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw createApiError(response.status, `音声合成に失敗しました`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw createTimeoutError(this.config.timeout);
      }
      if (error instanceof AivisSpeechError) {
        throw error;
      }
      throw createNetworkError('音声合成中にエラーが発生しました', error);
    }
  }

  /**
   * 音声を再生（リップシンク付き）
   */
  private async playAudioWithLipSync(audioBuffer: Buffer, lipSyncTimings: LipSyncTiming[]): Promise<void> {
    const tempFile = join(tmpdir(), 'yuichat_temp_audio.wav');

    try {
      // 一時ファイルに保存
      writeFileSync(tempFile, audioBuffer);

      // パスをエスケープ
      const escapedPath = tempFile.replace(/\\/g, '\\\\');

      // 音声再生を開始（非同期）
      const playbackPromise = execAsync(
        `powershell -c "(New-Object Media.SoundPlayer '${escapedPath}').PlaySync()"`,
        { encoding: 'utf-8' }
      ).catch(error => {
        const errorMsg = error instanceof Error ? error.message : String(error);
        const detail = `音声ファイル: ${tempFile}, エラー詳細: ${errorMsg}`;
        throw createPlaybackError(detail, error);
      });

      // リップシンク処理を開始
      const lipSyncPromise = this.performLipSync(lipSyncTimings);

      // 両方の完了を待機
      await Promise.all([playbackPromise, lipSyncPromise]);
    } finally {
      // 一時ファイルを削除
      if (existsSync(tempFile)) {
        try {
          unlinkSync(tempFile);
        } catch {
          // 削除失敗は無視
        }
      }
    }
  }

  /**
   * リップシンク処理を実行
   */
  private async performLipSync(timings: LipSyncTiming[]): Promise<void> {
    if (!this.vrmControl || timings.length === 0) {
      return;
    }

    // 音声再生開始までの遅延を考慮（PowerShell初期化時間）
    const playbackStartOffset = 150; // ミリ秒

    // 各母音のタイミングでsetVowelを呼び出すPromiseの配列を作成
    const lipSyncPromises = timings.map(timing => {
      return new Promise<void>(resolve => {
        const delayMs = (timing.startTime * 1000) + playbackStartOffset;
        setTimeout(async () => {
          try {
            await this.vrmControl!.setVowel(timing.vowel);
          } catch (error) {
            console.warn(`[LipSync] Failed to set vowel ${timing.vowel}:`, error);
          }
          resolve();
        }, delayMs);
      });
    });

    // すべてのリップシンクコマンドの送信完了を待機
    await Promise.all(lipSyncPromises);

    // 最後に口を閉じる（母音をnullに）
    try {
      await this.vrmControl.setVowel(null);
    } catch (error) {
      console.warn('[LipSync] Failed to close mouth:', error);
    }
  }

  /**
   * 指定時間待機
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 現在処理中かどうかを取得
   */
  public get processing(): boolean {
    return this.isProcessing;
  }
}
