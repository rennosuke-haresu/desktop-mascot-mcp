import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';

type EmotionType = 'neutral' | 'happy' | 'angry' | 'sad' | 'relaxed' | 'surprised';
type VowelType = 'a' | 'i' | 'u' | 'e' | 'o';

const EMOTION_EXPRESSIONS: Exclude<EmotionType, 'neutral'>[] = [
  'happy', 'angry', 'sad', 'relaxed', 'surprised',
];

/** リップシンクの補間速度（0.1=遅い、0.5=速い） */
const LERP_FACTOR = 0.2;

/**
 * 感情表情・リップシンクの管理
 */
export class ExpressionController {
  private targetVowelValues = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
  private currentVowelValues = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };

  constructor(private vrm: VRM) {}

  /**
   * 感情表情を設定（他の感情はリセット）
   */
  setEmotion(emotion: EmotionType): void {
    if (!this.vrm.expressionManager) return;

    const em = this.vrm.expressionManager;
    for (const expr of EMOTION_EXPRESSIONS) {
      em.setValue(expr, 0);
    }
    if (emotion !== 'neutral') {
      em.setValue(emotion, 1.0);
    }
  }

  /**
   * リップシンク用の目標母音を設定（実際の補間は update() で行う）
   */
  setVowel(vowel: VowelType | null): void {
    this.targetVowelValues.aa = vowel === 'a' ? 1.0 : 0;
    this.targetVowelValues.ih = vowel === 'i' ? 1.0 : 0;
    this.targetVowelValues.ou = vowel === 'u' ? 1.0 : 0;
    this.targetVowelValues.ee = vowel === 'e' ? 1.0 : 0;
    this.targetVowelValues.oh = vowel === 'o' ? 1.0 : 0;
  }

  /**
   * フレームごとのLerp補間処理（レンダリングループから呼び出す）
   */
  update(): void {
    if (!this.vrm.expressionManager) return;

    const em = this.vrm.expressionManager;
    const curr = this.currentVowelValues;
    const target = this.targetVowelValues;

    curr.aa = THREE.MathUtils.lerp(curr.aa, target.aa, LERP_FACTOR);
    curr.ih = THREE.MathUtils.lerp(curr.ih, target.ih, LERP_FACTOR);
    curr.ou = THREE.MathUtils.lerp(curr.ou, target.ou, LERP_FACTOR);
    curr.ee = THREE.MathUtils.lerp(curr.ee, target.ee, LERP_FACTOR);
    curr.oh = THREE.MathUtils.lerp(curr.oh, target.oh, LERP_FACTOR);

    em.setValue('aa', curr.aa);
    em.setValue('ih', curr.ih);
    em.setValue('ou', curr.ou);
    em.setValue('ee', curr.ee);
    em.setValue('oh', curr.oh);
  }
}
