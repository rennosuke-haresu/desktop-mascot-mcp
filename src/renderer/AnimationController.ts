import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation';

interface AnimationConfig {
  name: string;
  file: string;
  loop: boolean;
  fadeTime: number;
  returnToIdle: boolean;
  category: string;
  description: string;
}

interface AnimationState {
  clip: THREE.AnimationClip;
  action: THREE.AnimationAction;
  config: AnimationConfig;
}

/**
 * アニメーションの読み込み・再生・アイドルバリエーションを管理
 */
export class AnimationController {
  private animations: Map<string, AnimationState> = new Map();
  private currentAnimation: string = '';

  private idleVariationTimer: number | null = null;
  private idleVariationEnabled: boolean = true;
  private idleVariationDelayMin: number = 10000;
  private idleVariationDelayMax: number = 20000;
  private idleVariationAnimations: string[] = [];

  constructor(private vrm: VRM, private mixer: THREE.AnimationMixer) {}

  /**
   * animations.json からアニメーションを一括読み込み
   */
  async loadAll(configPath: string): Promise<void> {
    const response = await fetch(configPath);
    const config = await response.json();
    console.log(`[desktop-mascot-mcp] Found ${config.animations.length} animation configs`);

    if (config.config?.idleVariation) {
      const idleConfig = config.config.idleVariation;
      this.idleVariationEnabled = idleConfig.enabled ?? true;
      this.idleVariationDelayMin = idleConfig.delayMin ?? 10000;
      this.idleVariationDelayMax = idleConfig.delayMax ?? 20000;
      this.idleVariationAnimations = idleConfig.animations ?? [];
      console.log(
        `[desktop-mascot-mcp] Idle variation config loaded: enabled=${this.idleVariationEnabled}, ` +
        `delay=${this.idleVariationDelayMin}-${this.idleVariationDelayMax}ms, ` +
        `animations=${this.idleVariationAnimations.join(',')}`
      );
    }

    for (const animConfig of config.animations) {
      try {
        await this.loadAnimation(animConfig);
      } catch (error) {
        console.error(`[desktop-mascot-mcp] Failed to load animation ${animConfig.name}:`, error);
      }
    }

    console.log(`[desktop-mascot-mcp] Loaded ${this.animations.size} animations`);

    if (this.animations.has('idle')) {
      this.play('idle', false);
    } else {
      console.warn('[desktop-mascot-mcp] No idle animation found - applying default pose');
      this.setDefaultPose();
    }

    this.scheduleIdleVariation();
  }

  private async loadAnimation(config: AnimationConfig): Promise<void> {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

    const gltf = await loader.loadAsync(`./assets/animations/${config.file}`);
    const vrmAnimations = gltf.userData.vrmAnimations;

    if (!vrmAnimations || vrmAnimations.length === 0) {
      console.warn(`[desktop-mascot-mcp] No VRM animations found in ${config.file}`);
      return;
    }

    const clip = createVRMAnimationClip(vrmAnimations[0], this.vrm);
    const action = this.mixer.clipAction(clip);

    action.loop = config.loop ? THREE.LoopRepeat : THREE.LoopOnce;
    action.clampWhenFinished = true;

    if (!config.loop && config.returnToIdle) {
      this.mixer.addEventListener('finished', (e: any) => {
        if (e.action === action) {
          this.play('idle', false);
        }
      });
    }

    this.animations.set(config.name, { clip, action, config });
  }

  /**
   * アニメーションをクロスフェードで再生
   */
  play(name: string, resetTimer: boolean = true): void {
    const targetState = this.animations.get(name);
    const currentState = this.animations.get(this.currentAnimation);

    if (!targetState) {
      console.warn(`[desktop-mascot-mcp] Animation not found: ${name}`);
      return;
    }

    if (!currentState) {
      targetState.action.reset().play();
      this.currentAnimation = name;
      console.log(`[desktop-mascot-mcp] Playing animation: ${name}`);
      if (resetTimer) this.resetIdleTimer();
      return;
    }

    if (name === this.currentAnimation) return;

    const fadeTime = targetState.config.fadeTime;
    targetState.action.reset().fadeIn(fadeTime).play();
    currentState.action.fadeOut(fadeTime);
    this.currentAnimation = name;

    console.log(`[desktop-mascot-mcp] Playing animation: ${name} (fade: ${fadeTime}s)`);
    if (resetTimer) this.resetIdleTimer();
  }

  /**
   * アイドルタイマーをリセット（外部からの操作通知用）
   */
  resetIdleTimer(): void {
    this.scheduleIdleVariation();
  }

  private setDefaultPose(): void {
    if (!this.vrm.humanoid) return;
    const leftUpperArm = this.vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
    const rightUpperArm = this.vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
    if (leftUpperArm) leftUpperArm.rotation.z = -Math.PI / 6;
    if (rightUpperArm) rightUpperArm.rotation.z = Math.PI / 6;
  }

  private scheduleIdleVariation(): void {
    if (!this.idleVariationEnabled || this.idleVariationAnimations.length === 0) return;

    if (this.idleVariationTimer !== null) {
      clearTimeout(this.idleVariationTimer);
    }

    const delay =
      this.idleVariationDelayMin +
      Math.random() * (this.idleVariationDelayMax - this.idleVariationDelayMin);

    this.idleVariationTimer = window.setTimeout(() => {
      this.playIdleVariation();
    }, delay);
  }

  private playIdleVariation(): void {
    if (this.currentAnimation !== 'idle') return;

    const randomIndex = Math.floor(Math.random() * this.idleVariationAnimations.length);
    const animation = this.idleVariationAnimations[randomIndex];

    console.log(`[desktop-mascot-mcp] Playing idle variation: ${animation}`);
    this.play(animation, false);
    this.scheduleIdleVariation();
  }

  /**
   * フレームごとの更新（レンダリングループから呼び出す）
   */
  update(delta: number): void {
    this.mixer.update(delta);
  }

  dispose(): void {
    if (this.idleVariationTimer !== null) {
      clearTimeout(this.idleVariationTimer);
      this.idleVariationTimer = null;
    }
  }
}
