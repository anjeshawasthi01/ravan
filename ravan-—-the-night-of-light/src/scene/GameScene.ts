import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FestivalWorld } from './FestivalWorld';
import { RavanEffigy } from './RavanEffigy';
import { FirstPersonBow } from './FirstPersonBow';
import { ArrowFlight } from './ArrowFlight';
import { ParticleSystems } from './ParticleSystems';
import { soundManager } from '../audio/SoundManager';

export type GameState = 'opening' | 'playing' | 'arrow_in_flight' | 'burning' | 'finale' | 'victory';

export class GameScene {
  public container: HTMLElement;
  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  private clock: THREE.Clock = new THREE.Clock();
  private reqId: number | null = null;

  // Scene entities
  public world!: FestivalWorld;
  public ravan!: RavanEffigy;
  public bow!: FirstPersonBow;
  public arrowFlight!: ArrowFlight;
  public particles!: ParticleSystems;

  // Camera look & state
  public gameState: GameState = 'opening';
  private cameraYaw: number = 0;
  private cameraPitch: number = 0;
  private targetYaw: number = 0;
  private targetPitch: number = 0;
  private isPointerLocked: boolean = false;
  private isDragging: boolean = false;
  private previousPointerX: number = 0;
  private previousPointerY: number = 0;

  // Opening cinematic camera drift
  private openingTime: number = 0;

  // Camera shake & FOV punch for cinematic impact
  private cameraShakeIntensity: number = 0;
  private currentFov: number = 55;
  private targetFov: number = 55;

  // Lighting
  private keyLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // Callbacks to React UI
  public onStateChange?: (state: GameState) => void;
  public onDrawProgress?: (progress: number) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.initThree();
    this.initEntities();
    this.initEventListeners();
    this.startLoop();
  }

  private initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Renderer with ACESFilmic tone mapping and SRGB
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // 2. Scene with horizon-matching fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0c1333, 0.012);

    // 3. Camera (at human eye height: 1.75m)
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 300);
    this.camera.position.set(0, 1.75, 0);

    // 4. Procedural Studio Environment Map using PMREM
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTexture;
    pmremGenerator.dispose();

    // 5. Lighting rig (Warm key + cool festival fill)
    this.keyLight = new THREE.DirectionalLight(0xffecd1, 1.4);
    this.keyLight.position.set(15, 25, 10);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 100;
    this.keyLight.shadow.camera.left = -25;
    this.keyLight.shadow.camera.right = 25;
    this.keyLight.shadow.camera.top = 25;
    this.keyLight.shadow.camera.bottom = -5;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // Cool midnight indigo sky / warm earth ground fill
    this.hemiLight = new THREE.HemisphereLight(0x1a2456, 0x241610, 0.85);
    this.scene.add(this.hemiLight);
  }

  private initEntities() {
    // 1. Festival World
    this.world = new FestivalWorld();
    this.scene.add(this.world.group);

    // 2. 10-Headed Ravan Effigy
    this.ravan = new RavanEffigy();
    this.scene.add(this.ravan.group);

    // 3. First Person Bow & Hands attached directly to Camera
    this.bow = new FirstPersonBow();
    this.camera.add(this.bow.group);
    this.scene.add(this.camera);

    // In opening screen, hide the first-person hands/bow
    this.bow.group.visible = false;

    // 4. Guided Arrow of Dharma Flight
    this.arrowFlight = new ArrowFlight();
    this.scene.add(this.arrowFlight.group);

    // 5. Particle Systems (Sparks, Embers, Fireworks)
    this.particles = new ParticleSystems();
    this.scene.add(this.particles.group);

    // Wire Arrow hit callback
    this.arrowFlight.onHitRavan = (hitPos) => {
      this.handleArrowImpact(hitPos);
    };

    // Wire Head Eruptions
    this.ravan.onHeadIgnited = (headIdx, headWorldPos) => {
      this.particles.triggerHeadEruption(headWorldPos);
      this.cameraShakeIntensity = Math.min(this.cameraShakeIntensity + (headIdx === 0 ? 0.6 : 0.2), 1.5);
    };

    // Wire Ravan Dahan Milestones
    this.ravan.onBurnMilestone = (stage) => {
      if (stage === 'phase1') {
        this.cameraShakeIntensity = 1.2;
      } else if (stage === 'finale') {
        this.setGameState('finale');
        this.particles.startFireworksShow();
        // Play victory resolution music after initial fireworks burst
        setTimeout(() => {
          soundManager.playVictoryFanfare();
        }, 3200);

        // Transition to Victory screen
        setTimeout(() => {
          this.setGameState('victory');
        }, 5800);
      }
    };
  }

  // --- TRANSITIONS & STATE MANAGEMENT ---
  public enterFestival() {
    soundManager.init();

    // Smooth transition from cinematic opening view into first person gameplay
    this.setGameState('playing');
    this.bow.group.visible = true;
    this.bow.nockNewArrow();

    // Reset camera orientation to face Ravan directly
    this.targetYaw = 0;
    this.targetPitch = 0.05;
    this.cameraYaw = 0;
    this.cameraPitch = 0.05;
  }

  public setGameState(state: GameState) {
    this.gameState = state;
    this.onStateChange?.(state);
  }

  // --- CONTROLS & INPUT ---
  private initEventListeners() {
    const el = this.renderer.domElement;

    // Resize
    window.addEventListener('resize', this.onResize);

    // Pointer Lock
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === el;
    });

    // Pointer interactions
    el.addEventListener('pointerdown', (e) => {
      if (this.gameState === 'opening' || this.gameState === 'victory') return;

      this.isDragging = true;
      this.previousPointerX = e.clientX;
      this.previousPointerY = e.clientY;

      // Start drawing bow if ready to shoot
      if (this.gameState === 'playing' && e.button === 0) {
        this.bow.startDrawing();
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (this.gameState === 'opening') return;

      let dx = 0;
      let dy = 0;

      if (this.isPointerLocked) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (this.isDragging) {
        dx = e.clientX - this.previousPointerX;
        dy = e.clientY - this.previousPointerY;
        this.previousPointerX = e.clientX;
        this.previousPointerY = e.clientY;
      }

      if (dx !== 0 || dy !== 0) {
        const sensitivity = 0.0022;
        this.targetYaw -= dx * sensitivity;
        this.targetPitch -= dy * sensitivity;

        // Clamp pitch so player cannot flip camera upside down
        this.targetPitch = Math.max(-0.6, Math.min(0.7, this.targetPitch));
        // Clamp yaw to 120-degree festival cone
        this.targetYaw = Math.max(-1.1, Math.min(1.1, this.targetYaw));
      }
    });

    window.addEventListener('pointerup', (e) => {
      this.isDragging = false;
      if (this.gameState === 'playing' && this.bow.isDrawing) {
        this.handleBowRelease();
      }
    });

    // Keyboard Spacebar to shoot, R to replay
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.gameState === 'playing') {
        e.preventDefault();
        if (!this.bow.isDrawing) {
          this.bow.startDrawing();
        }
      } else if (e.code === 'KeyR' && this.gameState === 'victory') {
        this.resetGame();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && this.gameState === 'playing' && this.bow.isDrawing) {
        e.preventDefault();
        this.handleBowRelease();
      }
    });
  }

  public requestPointerLock() {
    try {
      this.renderer.domElement.requestPointerLock?.();
    } catch {
      // Graceful fallback
    }
  }

  // Mobile trigger helper
  public handleMobileDrawStart() {
    if (this.gameState === 'playing') {
      this.bow.startDrawing();
    }
  }

  public handleMobileDrawEnd() {
    if (this.gameState === 'playing' && this.bow.isDrawing) {
      this.handleBowRelease();
    }
  }

  private handleBowRelease() {
    const fired = this.bow.releaseArrow();
    if (!fired) return;

    // Arrow is in flight
    this.setGameState('arrow_in_flight');

    // Camera recoil kick & cinematic zoom in
    this.targetPitch += 0.045;
    this.targetFov = 47.0; // Cinematic camera focus tracking arrow flight

    // Get launch point and current forward camera aim direction
    const launchPos = this.bow.getWorldArrowLaunchPoint();
    const aimDir = new THREE.Vector3();
    this.camera.getWorldDirection(aimDir);

    // Guaranteed-Hit: Launch Arrow of Dharma toward Ravan's target point!
    this.arrowFlight.launch(launchPos, aimDir, this.ravan.targetPoint);
  }

  private handleArrowImpact(hitPos: THREE.Vector3) {
    // Violent cinematic impact punch
    this.cameraShakeIntensity = 1.45;
    this.targetFov = 42.0; // Dynamic impact zoom slam
    setTimeout(() => {
      this.targetFov = 54.0;
    }, 180);

    this.particles.triggerImpact(hitPos);
    this.ravan.ignite();
    this.setGameState('burning');
  }

  // --- GAME LOOP ---
  private startLoop() {
    const animate = () => {
      this.reqId = requestAnimationFrame(animate);
      const delta = Math.min(this.clock.getDelta(), 0.1);
      this.update(delta);
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private update(delta: number) {
    this.world.update(delta);
    this.particles.update(delta);

    // Update First Person Bow & report draw progress
    this.bow.update(delta);
    this.onDrawProgress?.(this.bow.drawProgress);

    // Update Guided Arrow
    this.arrowFlight.update(delta);

    // Update Ravan Effigy
    this.ravan.update(delta);

    // Continuous embers if Ravan is burning
    if (this.ravan.isIgnited) {
      this.particles.spawnEmbers(this.ravan.targetPoint, 4);
    }

    // Camera handling
    if (this.gameState === 'opening') {
      // Cinematic slow opening pan & gentle drift
      this.openingTime += delta;
      const pan = Math.sin(this.openingTime * 0.35) * 0.12;
      const driftY = 1.75 + Math.sin(this.openingTime * 0.5) * 0.15;
      this.camera.position.set(0, driftY, 0);
      this.camera.rotation.set(0.04, pan, 0);
    } else {
      // While arrow in flight, smoothly track arrow towards Ravan
      if (this.gameState === 'arrow_in_flight') {
        this.targetYaw = THREE.MathUtils.damp(this.targetYaw, 0.0, 6, delta);
        this.targetPitch = THREE.MathUtils.damp(this.targetPitch, 0.12, 6, delta);
      }

      // First person smooth aiming with exponential damping
      this.cameraYaw = THREE.MathUtils.damp(this.cameraYaw, this.targetYaw, 14, delta);
      this.cameraPitch = THREE.MathUtils.damp(this.cameraPitch, this.targetPitch, 14, delta);

      // Camera FOV damping
      this.currentFov = THREE.MathUtils.damp(this.currentFov, this.targetFov, 12, delta);
      if (Math.abs(this.camera.fov - this.currentFov) > 0.05) {
        this.camera.fov = this.currentFov;
        this.camera.updateProjectionMatrix();
      }

      // Camera shake with decaying physical momentum
      let shakeX = 0;
      let shakeY = 0;
      if (this.cameraShakeIntensity > 0) {
        shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity * 0.12;
        shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity * 0.12;
        this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - delta * 2.5);
      }

      this.camera.position.set(0, 1.75, 0);
      this.camera.rotation.set(this.cameraPitch + shakeY, this.cameraYaw + shakeX, 0, 'YXZ');
    }
  }

  // --- PLAY AGAIN (WITHOUT RELOADING PAGE) ---
  public resetGame() {
    this.ravan.reset();
    this.arrowFlight.reset();
    this.particles.reset();
    this.bow.nockNewArrow();
    this.setGameState('playing');
    this.targetYaw = 0;
    this.targetPitch = 0.05;
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public dispose() {
    if (this.reqId) cancelAnimationFrame(this.reqId);
    window.removeEventListener('resize', this.onResize);
    soundManager.dispose();
    this.renderer.dispose();
  }
}
