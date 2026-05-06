export function validateVowel(v: unknown): v is 'a' | 'i' | 'u' | 'e' | 'o' | null {
  const validVowels: unknown[] = ['a', 'i', 'u', 'e', 'o', null];
  return validVowels.includes(v);
}

export function validateEmotion(v: unknown): v is 'neutral' | 'happy' | 'angry' | 'sad' | 'relaxed' | 'surprised' {
  const validEmotions = ['neutral', 'happy', 'angry', 'sad', 'relaxed', 'surprised'];
  return typeof v === 'string' && validEmotions.includes(v);
}

export function validateSpeakPayload(data: unknown): data is { text: string; emotion?: string } {
  return typeof data === 'object' && data !== null && typeof (data as Record<string, unknown>).text === 'string';
}

export function validateAnimationPayload(data: unknown): data is { animation: string } {
  return typeof data === 'object' && data !== null && typeof (data as Record<string, unknown>).animation === 'string';
}
