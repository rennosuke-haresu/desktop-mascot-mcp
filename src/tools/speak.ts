import { AivisSpeechService } from '../services/AivisSpeechService.js';
import { VRMControlService } from '../services/VRMControlService.js';

/**
 * speak tool定義
 */
export function createSpeakTool(service: AivisSpeechService, vrmControl?: VRMControlService) {
  return {
    name: 'speak',
    description: 'テキストを音声で読み上げます。VRMキャラクターの表情とアニメーションを制御します。',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: '読み上げるテキスト。日本語で自然な会話文を入力してください。',
        },
        emotion: {
          type: 'string',
          enum: ['neutral', 'happy', 'sad', 'angry', 'relaxed', 'surprised'],
          description: 'VRMの表情（省略時はneutral）。会話の感情に応じて指定してください。',
        },
        animation: {
          type: 'string',
          enum: ['wave', 'nod', 'shake', 'think', 'clap', 'angry', 'happy', 'surprised', 'shy', 'cheer'],
          description: '発話中に再生するアニメーション（省略可）。ジェスチャーまたは感情表現のアニメーションを選択してください。',
        },
      },
      required: ['text'],
    },
    handler: async (args: { text: string; emotion?: string; animation?: string }) => {
      const { text, emotion = 'neutral', animation } = args;

      // 入力検証
      if (!text || text.trim().length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'エラー: 読み上げるテキストが空です。',
            },
          ],
        };
      }

      // emotion の型チェック（念のため）
      const validEmotions = ['neutral', 'happy', 'sad', 'angry', 'relaxed', 'surprised'];
      const finalEmotion = validEmotions.includes(emotion) ? emotion : 'neutral';

      try {
        // アニメーション再生（指定されている場合のみ）
        if (animation && vrmControl) {
          await vrmControl.playAnimation(animation);
        }

        // VRMウィンドウに音声再生を通知
        if (vrmControl) {
          await vrmControl.notifySpeak(text, finalEmotion);
        }

        // 音声再生を実行
        await service.speak(text);

        // 発話完了後、neutral以外の表情だった場合はneutralに戻す
        if (vrmControl && finalEmotion !== 'neutral') {
          await vrmControl.setEmotion('neutral');
        }

        return {
          content: [
            {
              type: 'text',
              text: '音声再生が完了しました',
            },
          ],
        };
      } catch (error) {
        // エラーハンドリング
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[speak tool] エラー:', errorMessage);

        return {
          content: [
            {
              type: 'text',
              text: `エラー: 音声再生に失敗しました。\n理由: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}
