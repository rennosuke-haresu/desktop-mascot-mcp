import * as THREE from 'three';
import { VRM, VRMLoaderPlugin } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation';

// Animation configuration types
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

export class VRMRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private vrm: VRM | null = null;
  private clock: THREE.Clock;
  private currentVowel: 'a' | 'i' | 'u' | 'e' | 'o' | null = null;
  private currentEmotion: 'neutral' | 'happy' | 'angry' | 'sad' | 'relaxed' | 'surprised' = 'neutral';

  // Animation
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, AnimationState> = new Map();
  private currentAnimation: string = '';

  // Idle variation (random animations during idle)
  private lastInteractionTime: number = Date.now();
  private idleVariationTimer: number | null = null;
  private idleVariationEnabled: boolean = true;
  private idleVariationDelayMin: number = 10000;
  private idleVariationDelayMax: number = 20000;
  private idleVariationAnimations: string[] = [];

  // Lip-sync smooth interpolation
  private targetVowelValues = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
  private currentVowelValues = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };

  // Configuration
  private animationsConfigPath: string;
  private storagePrefix: string;

  constructor(
    canvas: HTMLCanvasElement,
    animationsConfigPath: string = './assets/animations/animations.json',
    storagePrefix: string = 'desktop-mascot',
    cameraConfig?: {
      position: { x: number; y: number; z: number };
      lookAt: { x: number; y: number; z: number };
      fov: number;
    }
  ) {
    this.animationsConfigPath = animationsConfigPath;
    this.storagePrefix = storagePrefix;
    // Scene setup
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    // Camera setup with configuration
    const fov = cameraConfig?.fov ?? 45;
    const position = cameraConfig?.position ?? { x: 0, y: 1.0, z: -1.0 };
    const lookAt = cameraConfig?.lookAt ?? { x: 0, y: 1.0, z: 0 };

    this.camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0); // 完全透明

    // OrbitControls setup
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.update();

    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(1, 1, 1).normalize();
    this.scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  async loadVRM(url: string): Promise<void> {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    const gltf = await loader.loadAsync(url);
    this.vrm = gltf.userData.vrm as VRM;

    if (this.vrm) {
      this.scene.add(this.vrm.scene);

      // Load all animations (non-blocking)
      try {
        await this.loadAnimations();
      } catch (error) {
        console.error('[desktop-mascot-mcp] Failed to load animations (continuing without):', error);
      }

      console.log('[desktop-mascot-mcp] VRM model loaded');
    } else {
      throw new Error('Failed to load VRM model');
    }
  }

  /**
   * Load all animations from animations.json
   */
  private async loadAnimations(): Promise<void> {
    if (!this.vrm) {
      throw new Error('VRM not loaded');
    }

    // Initialize AnimationMixer
    this.mixer = new THREE.AnimationMixer(this.vrm.scene);

    // Load animations config
    const response = await fetch(this.animationsConfigPath);
    const config = await response.json();
    console.log(`[desktop-mascot-mcp] Found ${config.animations.length} animation configs`);

    // Load idle variation config
    if (config.config?.idleVariation) {
      const idleConfig = config.config.idleVariation;
      this.idleVariationEnabled = idleConfig.enabled ?? true;
      this.idleVariationDelayMin = idleConfig.delayMin ?? 10000;
      this.idleVariationDelayMax = idleConfig.delayMax ?? 20000;
      this.idleVariationAnimations = idleConfig.animations ?? [];
      console.log(`[desktop-mascot-mcp] Idle variation config loaded: enabled=${this.idleVariationEnabled}, delay=${this.idleVariationDelayMin}-${this.idleVariationDelayMax}ms, animations=${this.idleVariationAnimations.join(',')}`);
    }

    // Load each animation
    for (const animConfig of config.animations) {
      try {
        await this.loadAnimation(animConfig);
      } catch (error) {
        console.error(`[desktop-mascot-mcp] Failed to load animation ${animConfig.name}:`, error);
      }
    }

    console.log(`[desktop-mascot-mcp] Loaded ${this.animations.size} animations`);

    // Start with idle animation, or fall back to default pose
    if (this.animations.has('idle')) {
      this.playAnimation('idle');
    } else {
      console.warn('[desktop-mascot-mcp] No idle animation found - applying default pose');
      this.setDefaultPose();
    }

    // Start idle variation timer
    this.scheduleIdleVariation();
  }

  /**
   * Load individual animation
   */
  private async loadAnimation(config: AnimationConfig): Promise<void> {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

    const gltf = await loader.loadAsync(`./assets/animations/${config.file}`);
    const vrmAnimations = gltf.userData.vrmAnimations;

    if (!vrmAnimations || vrmAnimations.length === 0) {
      console.warn(`[desktop-mascot-mcp] No VRM animations found in ${config.file}`);
      return;
    }

    const clip = createVRMAnimationClip(vrmAnimations[0], this.vrm!);
    const action = this.mixer!.clipAction(clip);

    // Loop settings
    action.loop = config.loop ? THREE.LoopRepeat : THREE.LoopOnce;
    action.clampWhenFinished = true;

    // Callback for returnToIdle
    if (!config.loop && config.returnToIdle) {
      this.mixer!.addEventListener('finished', (e: any) => {
        if (e.action === action) {
          this.playAnimation('idle');
        }
      });
    }

    this.animations.set(config.name, { clip, action, config });
  }

  /**
   * Play animation with crossfade
   */
  playAnimation(name: string, resetTimer: boolean = true): void {
    const targetState = this.animations.get(name);
    const currentState = this.animations.get(this.currentAnimation);

    if (!targetState) {
      console.warn(`[desktop-mascot-mcp] Animation not found: ${name}`);
      return;
    }

    if (!currentState) {
      // First time - just play
      targetState.action.reset().play();
      this.currentAnimation = name;
      console.log(`[desktop-mascot-mcp] Playing animation: ${name}`);

      // Reset idle timer on user interaction
      if (resetTimer) {
        this.resetIdleTimer();
      }
      return;
    }

    if (name === this.currentAnimation) {
      return; // Already playing
    }

    const fadeTime = targetState.config.fadeTime;

    // Crossfade
    targetState.action.reset().fadeIn(fadeTime).play();
    currentState.action.fadeOut(fadeTime);

    this.currentAnimation = name;

    console.log(`[desktop-mascot-mcp] Playing animation: ${name} (fade: ${fadeTime}s)`);

    // Reset idle timer on user interaction
    if (resetTimer) {
      this.resetIdleTimer();
    }
  }

  /**
   * Apply a natural standing pose when no idle animation is available.
   * Lowers arms from T-pose to a relaxed A-pose-like position.
   */
  private setDefaultPose(): void {
    if (!this.vrm?.humanoid) return;

    const leftUpperArm = this.vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
    const rightUpperArm = this.vrm.humanoid.getNormalizedBoneNode('rightUpperArm');

    if (leftUpperArm) {
      leftUpperArm.rotation.z = -Math.PI / 6; // ~30° down
    }
    if (rightUpperArm) {
      rightUpperArm.rotation.z = Math.PI / 6; // ~30° down
    }
  }

  /**
   * Schedule next idle variation animation
   */
  private scheduleIdleVariation(): void {
    // Skip if disabled or no animations configured
    if (!this.idleVariationEnabled || this.idleVariationAnimations.length === 0) {
      return;
    }

    // Clear existing timer
    if (this.idleVariationTimer !== null) {
      clearTimeout(this.idleVariationTimer);
    }

    // Random delay between min and max
    const delay =
      this.idleVariationDelayMin +
      Math.random() * (this.idleVariationDelayMax - this.idleVariationDelayMin);

    this.idleVariationTimer = window.setTimeout(() => {
      this.playIdleVariation();
    }, delay);
  }

  /**
   * Play random idle variation animation
   */
  private playIdleVariation(): void {
    // Only play if currently on idle animation
    if (this.currentAnimation !== 'idle') {
      return;
    }

    // Select random animation
    const randomIndex = Math.floor(Math.random() * this.idleVariationAnimations.length);
    const animation = this.idleVariationAnimations[randomIndex];

    console.log(`[desktop-mascot-mcp] Playing idle variation: ${animation}`);
    this.playAnimation(animation, false); // Don't reset timer for automatic variations

    // Schedule next variation
    this.scheduleIdleVariation();
  }

  /**
   * Reset idle timer (called on user interaction)
   */
  private resetIdleTimer(): void {
    this.lastInteractionTime = Date.now();
    this.scheduleIdleVariation();
  }

  startAnimation(): void {
    const animate = () => {
      requestAnimationFrame(animate);

      const deltaTime = this.clock.getDelta();

      // Update animation mixer (body animation)
      if (this.mixer) {
        this.mixer.update(deltaTime);
      }

      // Update lip-sync (prioritized over animation)
      this.updateLipSync();

      // Update VRM
      if (this.vrm) {
        this.vrm.update(deltaTime);
      }

      // Update OrbitControls
      this.controls.update();

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  getVRM(): VRM | null {
    return this.vrm;
  }

  // Lip-sync methods
  setVowel(vowel: 'a' | 'i' | 'u' | 'e' | 'o' | null): void {
    this.currentVowel = vowel;

    // 目標値のみを更新（即座に変更せず、アニメーションループでLerp補間）
    this.targetVowelValues.aa = vowel === 'a' ? 1.0 : 0;
    this.targetVowelValues.ih = vowel === 'i' ? 1.0 : 0;
    this.targetVowelValues.ou = vowel === 'u' ? 1.0 : 0;
    this.targetVowelValues.ee = vowel === 'e' ? 1.0 : 0;
    this.targetVowelValues.oh = vowel === 'o' ? 1.0 : 0;

    // Reset idle timer on speech activity
    if (vowel !== null) {
      this.resetIdleTimer();
    }
  }

  // Lerp interpolation for smooth lip-sync animation
  private updateLipSync(): void {
    if (!this.vrm?.expressionManager) return;

    const lerpFactor = 0.2; // 補間速度（0.1=遅い、0.5=速い）

    // 現在値を目標値に向けてLerp
    this.currentVowelValues.aa = THREE.MathUtils.lerp(
      this.currentVowelValues.aa,
      this.targetVowelValues.aa,
      lerpFactor
    );
    this.currentVowelValues.ih = THREE.MathUtils.lerp(
      this.currentVowelValues.ih,
      this.targetVowelValues.ih,
      lerpFactor
    );
    this.currentVowelValues.ou = THREE.MathUtils.lerp(
      this.currentVowelValues.ou,
      this.targetVowelValues.ou,
      lerpFactor
    );
    this.currentVowelValues.ee = THREE.MathUtils.lerp(
      this.currentVowelValues.ee,
      this.targetVowelValues.ee,
      lerpFactor
    );
    this.currentVowelValues.oh = THREE.MathUtils.lerp(
      this.currentVowelValues.oh,
      this.targetVowelValues.oh,
      lerpFactor
    );

    // BlendShapeに適用
    const expressionManager = this.vrm.expressionManager;
    expressionManager.setValue('aa', this.currentVowelValues.aa);
    expressionManager.setValue('ih', this.currentVowelValues.ih);
    expressionManager.setValue('ou', this.currentVowelValues.ou);
    expressionManager.setValue('ee', this.currentVowelValues.ee);
    expressionManager.setValue('oh', this.currentVowelValues.oh);
  }

  // Emotion expression methods
  setEmotion(emotion: 'neutral' | 'happy' | 'angry' | 'sad' | 'relaxed' | 'surprised'): void {
    if (!this.vrm?.expressionManager) return;

    this.currentEmotion = emotion;

    const expressionManager = this.vrm.expressionManager;

    // Reset all emotion expressions
    expressionManager.setValue('happy', 0);
    expressionManager.setValue('angry', 0);
    expressionManager.setValue('sad', 0);
    expressionManager.setValue('relaxed', 0);
    expressionManager.setValue('surprised', 0);

    // Set current emotion
    if (emotion === 'happy') {
      expressionManager.setValue('happy', 1.0);
    } else if (emotion === 'angry') {
      expressionManager.setValue('angry', 1.0);
    } else if (emotion === 'sad') {
      expressionManager.setValue('sad', 1.0);
    } else if (emotion === 'relaxed') {
      expressionManager.setValue('relaxed', 1.0);
    } else if (emotion === 'surprised') {
      expressionManager.setValue('surprised', 1.0);
    }

    // Reset idle timer on emotion change
    this.resetIdleTimer();
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Camera state persistence
  saveCameraState(): void {
    const state = {
      position: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      },
      target: {
        x: this.controls.target.x,
        y: this.controls.target.y,
        z: this.controls.target.z,
      },
    };
    const storageKey = `${this.storagePrefix}-camera-state`;
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  loadCameraState(): void {
    const storageKey = `${this.storagePrefix}-camera-state`;
    const stored = localStorage.getItem(storageKey);
    if (!stored) return;

    try {
      const state = JSON.parse(stored);
      if (state.position) {
        this.camera.position.set(state.position.x, state.position.y, state.position.z);
      }
      if (state.target) {
        this.controls.target.set(state.target.x, state.target.y, state.target.z);
      }
      this.controls.update();
      console.log('[desktop-mascot-mcp] Camera state restored');
    } catch (error) {
      console.error('[desktop-mascot-mcp] Failed to load camera state:', error);
    }
  }
}
