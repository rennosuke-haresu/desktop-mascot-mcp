/**
 * VRMControlService - Electronウィンドウと通信してVRMを制御
 */
export class VRMControlService {
  private readonly baseUrl: string;

  constructor(port: number = 3939) {
    this.baseUrl = `http://localhost:${port}`;
  }

  /**
   * 母音を設定
   */
  async setVowel(vowel: 'a' | 'i' | 'u' | 'e' | 'o' | null): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/vrm/vowel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vowel }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Electronウィンドウが起動していない場合は静かに失敗
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        console.warn('VRM window not running - skipping vowel control');
      } else {
        console.error('Failed to set vowel:', error);
      }
    }
  }

  /**
   * 感情を設定
   */
  async setEmotion(emotion: 'neutral' | 'happy' | 'angry' | 'sad' | 'relaxed' | 'surprised'): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/vrm/emotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emotion }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Electronウィンドウが起動していない場合は静かに失敗
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        console.warn('VRM window not running - skipping emotion control');
      } else {
        console.error('Failed to set emotion:', error);
      }
    }
  }

  /**
   * 音声再生開始を通知
   */
  async notifySpeak(text: string, emotion?: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/vrm/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, emotion }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Electronウィンドウが起動していない場合は静かに失敗
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        console.warn('VRM window not running - skipping speak notification');
      } else {
        console.error('Failed to notify speak:', error);
      }
    }
  }

  /**
   * アニメーションを再生
   */
  async playAnimation(animation: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/vrm/animation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animation }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Electronウィンドウが起動していない場合は静かに失敗
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        console.warn('VRM window not running - skipping animation control');
      } else {
        console.error('Failed to play animation:', error);
      }
    }
  }

  /**
   * VRMウィンドウの起動状態をチェック
   */
  async isVRMWindowRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/vrm/emotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emotion: 'neutral' }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
