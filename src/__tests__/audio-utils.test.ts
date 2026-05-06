import { describe, it, expect } from 'vitest';
import { calculateAudioDuration, extractLipSyncTimings } from '../utils/audio.js';
import type { AudioQuery } from '../types/index.js';

function makeQuery(overrides: Partial<AudioQuery> = {}): AudioQuery {
  return {
    accent_phrases: [],
    speedScale: 1,
    pitchScale: 0,
    intonationScale: 1,
    volumeScale: 1,
    prePhonemeLength: 0.1,
    postPhonemeLength: 0.1,
    outputSamplingRate: 22050,
    outputStereo: false,
    ...overrides,
  };
}

function makeBuffer(dataSizeBytes: number): Buffer {
  // 44バイトの WAV ヘッダー + データ領域
  return Buffer.alloc(44 + dataSizeBytes);
}

describe('calculateAudioDuration', () => {
  it('22050Hz モノラル、88200バイト → 2.0秒', () => {
    // 22050Hz * 1ch * 2bytes/sample * 2s = 88200 bytes
    const buffer = makeBuffer(88200);
    const query = makeQuery({ outputSamplingRate: 22050, outputStereo: false });
    expect(calculateAudioDuration(buffer, query)).toBeCloseTo(2.0);
  });

  it('ステレオは同じデータ量で半分の長さ', () => {
    const buffer = makeBuffer(88200);
    const query = makeQuery({ outputSamplingRate: 22050, outputStereo: true });
    expect(calculateAudioDuration(buffer, query)).toBeCloseTo(1.0);
  });

  it('データなし（ヘッダーのみ）→ 0秒', () => {
    const buffer = makeBuffer(0);
    const query = makeQuery({ outputSamplingRate: 22050, outputStereo: false });
    expect(calculateAudioDuration(buffer, query)).toBe(0);
  });
});

describe('extractLipSyncTimings', () => {
  it('accent_phrases が空のとき [] を返す', () => {
    const query = makeQuery({ accent_phrases: [] });
    expect(extractLipSyncTimings(query, 3.0)).toEqual([]);
  });

  it('3モーラ a/i/u、3秒 → 均等間隔タイミング', () => {
    const query = makeQuery({
      accent_phrases: [{
        moras: [
          { text: 'あ', vowel: 'a', vowel_length: 0, pitch: 0 },
          { text: 'い', vowel: 'i', vowel_length: 0, pitch: 0 },
          { text: 'う', vowel: 'u', vowel_length: 0, pitch: 0 },
        ],
        accent: 0,
      }],
    });
    const timings = extractLipSyncTimings(query, 3.0);
    expect(timings).toHaveLength(3);
    expect(timings[0]).toEqual({ vowel: 'a', startTime: 0.0 });
    expect(timings[1]).toEqual({ vowel: 'i', startTime: 1.0 });
    expect(timings[2]).toEqual({ vowel: 'u', startTime: 2.0 });
  });

  it('vowel が空文字のモーラは除外される', () => {
    const query = makeQuery({
      accent_phrases: [{
        moras: [
          { text: 'あ', vowel: 'a', vowel_length: 0, pitch: 0 },
          { text: 'っ', vowel: '', vowel_length: 0, pitch: 0 },
        ],
        accent: 0,
      }],
    });
    const timings = extractLipSyncTimings(query, 2.0);
    expect(timings).toHaveLength(1);
    expect(timings[0].vowel).toBe('a');
  });

  it('a/i/u/e/o 以外の vowel（例: "N"）は除外される', () => {
    const query = makeQuery({
      accent_phrases: [{
        moras: [
          { text: 'ん', vowel: 'N', vowel_length: 0, pitch: 0 },
          { text: 'あ', vowel: 'a', vowel_length: 0, pitch: 0 },
        ],
        accent: 0,
      }],
    });
    const timings = extractLipSyncTimings(query, 2.0);
    expect(timings).toHaveLength(1);
    expect(timings[0].vowel).toBe('a');
  });

  it('有効・無効混在 → a/i/u/e/o のみ含まれる', () => {
    const query = makeQuery({
      accent_phrases: [{
        moras: [
          { text: 'あ', vowel: 'a', vowel_length: 0, pitch: 0 },
          { text: 'ん', vowel: 'N', vowel_length: 0, pitch: 0 },
          { text: 'え', vowel: 'e', vowel_length: 0, pitch: 0 },
          { text: 'っ', vowel: '', vowel_length: 0, pitch: 0 },
          { text: 'お', vowel: 'o', vowel_length: 0, pitch: 0 },
        ],
        accent: 0,
      }],
    });
    const timings = extractLipSyncTimings(query, 5.0);
    expect(timings.map(t => t.vowel)).toEqual(['a', 'e', 'o']);
  });
});
