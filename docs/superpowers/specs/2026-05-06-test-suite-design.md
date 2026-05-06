# Test Suite Design — desktop-mascot-mcp

**Date:** 2026-05-06  
**Version target:** v0.3.2+  
**Status:** Approved

---

## Goals

- Prevent regressions in pure logic during future refactoring (especially Phase 4 additions)
- Document and specify the behavior of core calculation and validation functions
- Enable CI (GitHub Actions) to catch breaks on push/PR

## Out of Scope

- Electron IPC / window lifecycle (Electron environment dependency)
- Three.js VRM rendering (WebGL / DOM dependency)
- Network calls (fetch, VOICEVOX API) — no mock tests; deferred until pure logic grows
- End-to-end audio playback (OS / hardware dependency)

---

## Framework

**Vitest** (`vitest run` for single-pass, `vitest` for watch mode)

Rationale: The project uses `"type": "module"` (ESModule). Jest requires CommonJS transform configuration, while Vitest works natively with ESM and TypeScript.

---

## Structural Changes (Refactoring)

Two new utility files will be extracted from existing modules. These are design improvements independent of testing — the logic currently embedded in class methods or HTTP handlers has no stateful dependency on its container.

### `src/utils/audio.ts` (new)

Move from `TtsService.ts`:
- `LipSyncTiming` interface (export it here)
- `calculateAudioDuration(buffer: Buffer, query: AudioQuery): number`
- `extractLipSyncTimings(query: AudioQuery, audioDurationSeconds: number): LipSyncTiming[]`
- `getPlaybackStartOffset(): number` (platform-specific constant, leave in TtsService)

`TtsService.ts` will call these functions instead of defining them as private methods.

### `src/utils/validation.ts` (new)

Extract from `httpServer.ts`:
- `validateVowel(v: unknown): v is 'a' | 'i' | 'u' | 'e' | 'o' | null`
- `validateEmotion(v: unknown): v is 'neutral' | 'happy' | 'angry' | 'sad' | 'relaxed' | 'surprised'`
- `validateSpeakPayload(data: unknown): data is { text: string; emotion?: string }`
- `validateAnimationPayload(data: unknown): data is { animation: string }`

`httpServer.ts` will import and call these instead of inline comparisons.

---

## Test Files

### `src/__tests__/errors.test.ts` (~15 cases)

**Subject:** `src/utils/errors.ts`

| Test case | Expected |
|-----------|----------|
| `new TtsError({ type: NETWORK, retryable: true })` | `canRetry()` returns `true` |
| `new TtsError({ type: PLAYBACK, retryable: false })` | `canRetry()` returns `false` |
| `toString()` with retryable | `"[NETWORK] ... (retryable)"` |
| `toString()` without retryable | `"[PLAYBACK] ..."` (no suffix) |
| `createNetworkError()` | `retryable: true`, `type: NETWORK` |
| `createApiError(500, ...)` | `retryable: true` (5xx is retryable) |
| `createApiError(400, ...)` | `retryable: false` (4xx is not retryable) |
| `createApiError(503, ...)` | `retryable: true` |
| `createTimeoutError(5000)` | `retryable: true`, `type: TIMEOUT`, message includes "5000ms" |
| `createPlaybackError(...)` | `retryable: false`, `type: PLAYBACK` |
| `wrapError(existingTtsError)` | returns the same instance unchanged |
| `wrapError(new TypeError("fetch failed"))` | returns a NETWORK TtsError |
| `wrapError(new Error("other"))` | returns an UNKNOWN TtsError |
| `TtsError.name` | `"TtsError"` |

### `src/__tests__/audio-utils.test.ts` (~10 cases)

**Subject:** `src/utils/audio.ts`

For `calculateAudioDuration(buffer, query)`:

| Test case | Expected |
|-----------|----------|
| 44-byte header + 88200 bytes of data, 22050Hz mono, 16-bit | `2.0` seconds |
| Same data but stereo (`outputStereo: true`) | `1.0` second |
| Header only (0 data bytes) | `0` seconds |

For `extractLipSyncTimings(query, duration)`:

| Test case | Expected |
|-----------|----------|
| Empty `accent_phrases` | `[]` |
| 3 moras with vowels a/i/u, 3.0s duration | timings at 0.0s, 1.0s, 2.0s |
| Mora with empty `vowel` string | excluded from result |
| Mora with consonant-only (e.g. `vowel: "N"`) | excluded from result (not in a/i/u/e/o) |
| Mixed valid/invalid vowels | only a/i/u/e/o moras appear in result |

### `src/__tests__/http-validation.test.ts` (~10 cases)

**Subject:** `src/utils/validation.ts`

| Function | Valid inputs | Invalid inputs |
|----------|-------------|----------------|
| `validateVowel` | `'a'`, `'i'`, `'u'`, `'e'`, `'o'`, `null` | `'x'`, `undefined`, `123`, `''` (note: `null` is valid — means "close mouth") |
| `validateEmotion` | `'neutral'`, `'happy'`, `'angry'`, `'sad'`, `'relaxed'`, `'surprised'` | `'fear'`, `null`, `123`, `''` |
| `validateSpeakPayload` | `{ text: "hello" }`, `{ text: "hi", emotion: "happy" }` | `{ text: 123 }`, `{}`, `null` |
| `validateAnimationPayload` | `{ animation: "idle" }` | `{ animation: null }`, `{}`, `{ animation: 5 }` |

---

## Configuration Files

### `vitest.config.ts` (new, project root)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    environment: 'node',
  },
});
```

### `package.json` changes

```json
"scripts": {
  "test": "vitest run"
},
"devDependencies": {
  "vitest": "^2.0.0"
}
```

### `.github/workflows/test.yml` (new)

```yaml
name: Test
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
```

---

## Implementation Order

1. Install Vitest and update `package.json`
2. Create `vitest.config.ts`
3. Extract `src/utils/audio.ts` and update `TtsService.ts` to import from it
4. Extract `src/utils/validation.ts` and update `httpServer.ts` to import from it
5. Write `src/__tests__/errors.test.ts`
6. Write `src/__tests__/audio-utils.test.ts`
7. Write `src/__tests__/http-validation.test.ts`
8. Create `.github/workflows/test.yml`
9. Run `npm test` and confirm all tests pass
10. Commit

---

## Non-Goals (Explicitly Deferred)

- Mock-based tests for `VRMControlService` (fetch mock) — adds complexity without meaningful benefit at current scale
- Mock-based tests for `TtsService.speak()` full flow — same reason
- Coverage reporting — not needed yet
- E2E tests against real VOICEVOX API — CI incompatible
