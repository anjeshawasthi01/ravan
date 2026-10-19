import * as THREE from 'three';
import { soundManager } from '../audio/SoundManager';

interface SparkParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  decay: number;
  gravity: number;
  drag: number;
}

interface FireworkShell {
  type: 'chrysanthemum' | 'radial' | 'starburst' | 'turquoise' | 'willow' | 'comet';
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  targetY: number;
  hasExploded: boolean;
  baseColor: THREE.Color;
  accentColor: THREE.Color;
}

export class ParticleSystems {
  public group: THREE.Group;

  // Active particle lists
  private sparks: SparkParticle[] = [];
  private fireworkShells: FireworkShell[] = [];

  // Shockwave rings & sacred mandala
  private shockwaves: { mesh: THREE.Mesh; scale: number; maxScale: number; alpha: number; speed: number }[] = [];
  private mandalaTexture: THREE.CanvasTexture;

  // Buffer geometries & points
  private sparksPoints!: THREE.Points;
  private sparksGeo!: THREE.BufferGeometry;
  private maxSparks: number = 3200;
  private sparkPositions: Float32Array;
  private sparkColors: Float32Array;
  private sparkSizes: Float32Array;

  // Dynamic light for fireworks, flash, and impact
  private fireworkLight: THREE.PointLight;

  // Auto firework sequence coordinator
  public isFinaleActive: boolean = false;
  private finaleTimer: number = 0;
  private fireworkCounter: number = 0;

  constructor() {
    this.group = new THREE.Group();

    this.sparkPositions = new Float32Array(this.maxSparks * 3);
    this.sparkColors = new Float32Array(this.maxSparks * 3);
    this.sparkSizes = new Float32Array(this.maxSparks);

    this.mandalaTexture = this.generateMandalaTexture();
    this.initSparksSystem();

    // Firework flash & impact light
    this.fireworkLight = new THREE.PointLight(0xffd277, 0, 85);
    this.fireworkLight.position.set(0, 25, -40);
    this.group.add(this.fireworkLight);
  }

  private generateMandalaTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const cx = 256;
    const cy = 256;

    // Glowing golden radial mandala for shockwave
    ctx.clearRect(0, 0, 512, 512);

    // Outer glow ring
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, 230, 0, Math.PI * 2);
    ctx.stroke();

    // 16-petal lotus mandala
    const petals = 16;
    ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
    for (let i = 0; i < petals; i++) {
      const a = (i * Math.PI * 2) / petals;
      const x1 = cx + Math.cos(a) * 190;
      const y1 = cy + Math.sin(a) * 190;
      const x2 = cx + Math.cos(a + 0.2) * 130;
      const y2 = cy + Math.sin(a + 0.2) * 130;
      const x3 = cx + Math.cos(a - 0.2) * 130;
      const y3 = cy + Math.sin(a - 0.2) * 130;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.fill();
    }

    // Inner bright sun
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 55, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private initSparksSystem() {
    this.sparksGeo = new THREE.BufferGeometry();
    this.sparksGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    this.sparksGeo.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));
    this.sparksGeo.setAttribute('size', new THREE.BufferAttribute(this.sparkSizes, 1));

    // Custom point texture for soft circular particle
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 240, 180, 0.9)');
    grad.addColorStop(0.7, 'rgba(255, 170, 50, 0.4)');
    grad.addColorStop(1, 'rgba(255, 100, 20, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const pTex = new THREE.CanvasTexture(canvas);

    const sparksMat = new THREE.PointsMaterial({
      map: pTex,
      vertexColors: true,
      size: 1.6,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sparksPoints = new THREE.Points(this.sparksGeo, sparksMat);
    this.sparksPoints.frustumCulled = false;
    this.group.add(this.sparksPoints);
  }

  // --- EPIC ARROW IMPACT SHOCKWAVE & SPARKS ---
  public triggerImpact(pos: THREE.Vector3) {
    // 1. Giant Sacred Lotus Mandala Shockwave (blasts outward across the world)
    const mandalaGeo = new THREE.PlaneGeometry(1, 1);
    const mandalaMat = new THREE.MeshBasicMaterial({
      map: this.mandalaTexture,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const mandalaMesh = new THREE.Mesh(mandalaGeo, mandalaMat);
    mandalaMesh.position.copy(pos).add(new THREE.Vector3(0, 0, 0.3));
    this.group.add(mandalaMesh);
    this.shockwaves.push({ mesh: mandalaMesh, scale: 1.0, maxScale: 32.0, alpha: 1.0, speed: 38.0 });

    // 2. High-speed supersonic energy ring
    const ringGeo = new THREE.RingGeometry(0.3, 0.8, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos).add(new THREE.Vector3(0, 0, 0.4));
    this.group.add(ring);
    this.shockwaves.push({ mesh: ring, scale: 1.0, maxScale: 24.0, alpha: 1.0, speed: 45.0 });

    // 3. Massive Shower of 420+ Radiant Sparks & Divine Shrapnel
    const count = 420;
    for (let i = 0; i < count; i++) {
      if (this.sparks.length >= this.maxSparks) break;

      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const speed = 6.0 + Math.random() * 24.0;

      const vel = new THREE.Vector3(
        Math.sin(theta) * Math.cos(phi) * speed,
        Math.sin(theta) * Math.sin(phi) * speed + 3.0,
        Math.cos(theta) * speed * 0.8
      );

      const colorRoll = Math.random();
      const color = colorRoll > 0.6
        ? new THREE.Color(0xffffff) // Blinding white core
        : colorRoll > 0.3
        ? new THREE.Color(0xffd700) // Pure gold
        : new THREE.Color(0xf97316); // Fiery saffron

      this.sparks.push({
        pos: pos.clone(),
        vel,
        color,
        size: 1.8 + Math.random() * 2.4,
        alpha: 1.0,
        life: 0,
        maxLife: 1.0 + Math.random() * 1.4,
        decay: 1.0,
        gravity: 12.0,
        drag: 0.94
      });
    }

    // Heavy Screen Flash Light
    this.fireworkLight.position.copy(pos).add(new THREE.Vector3(0, 0, 2.0));
    this.fireworkLight.color.setHex(0xfff3a1);
    this.fireworkLight.intensity = 36.0;
  }

  // --- HEAD IGNITION EXPLOSIVE BURST ---
  public triggerHeadEruption(headPos: THREE.Vector3) {
    // Blast 65 high-energy sparks and embers upward from this head
    for (let i = 0; i < 65; i++) {
      if (this.sparks.length >= this.maxSparks) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 3.0 + Math.random() * 9.0;
      const vel = new THREE.Vector3(
        Math.cos(angle) * speed,
        6.0 + Math.random() * 12.0, // Launches upward!
        Math.sin(angle) * speed
      );

      this.sparks.push({
        pos: headPos.clone(),
        vel,
        color: Math.random() > 0.4 ? new THREE.Color(0xffe259) : new THREE.Color(0xff5722),
        size: 1.5 + Math.random() * 1.5,
        alpha: 1.0,
        life: 0,
        maxLife: 1.4 + Math.random() * 0.8,
        decay: 1.0,
        gravity: 7.0,
        drag: 0.95
      });
    }
  }

  // --- RAVAN DAHAN RISING EMBERS ---
  public spawnEmbers(origin: THREE.Vector3, count: number = 6) {
    for (let i = 0; i < count; i++) {
      if (this.sparks.length >= this.maxSparks) break;

      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 4.5,
        Math.random() * 7.0,
        (Math.random() - 0.5) * 2.5
      );

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.8,
        2.5 + Math.random() * 4.5,
        (Math.random() - 0.5) * 1.8
      );

      const color = Math.random() > 0.4 ? new THREE.Color(0xffa200) : new THREE.Color(0xef4444);

      this.sparks.push({
        pos: origin.clone().add(offset),
        vel,
        color,
        size: 1.0 + Math.random() * 1.5,
        alpha: 0.9,
        life: 0,
        maxLife: 2.2 + Math.random() * 2.0,
        decay: 0.5,
        gravity: -1.5, // Floats upward
        drag: 0.98
      });
    }
  }

  // --- FIREWORKS FINALE SHOW ---
  public startFireworksShow() {
    this.isFinaleActive = true;
    this.finaleTimer = 0;
    this.fireworkCounter = 0;
  }

  public launchFirework(
    type: 'chrysanthemum' | 'radial' | 'starburst' | 'turquoise' | 'willow' | 'comet',
    originX: number,
    targetY: number,
    targetZ: number = -45
  ) {
    soundManager.playFireworkLaunch();

    const colorPresets = {
      chrysanthemum: { base: new THREE.Color(0xffd700), accent: new THREE.Color(0xffa500) },
      radial: { base: new THREE.Color(0xef4444), accent: new THREE.Color(0xf59e0b) },
      starburst: { base: new THREE.Color(0xd946ef), accent: new THREE.Color(0x8b5cf6) },
      turquoise: { base: new THREE.Color(0x06b6d4), accent: new THREE.Color(0x10b981) },
      willow: { base: new THREE.Color(0xfef08a), accent: new THREE.Color(0xf59e0b) },
      comet: { base: new THREE.Color(0x38bdf8), accent: new THREE.Color(0xffffff) }
    };

    const preset = colorPresets[type];

    const shell: FireworkShell = {
      type,
      pos: new THREE.Vector3(originX, 1.0, targetZ),
      vel: new THREE.Vector3((Math.random() - 0.5) * 1.5, 34.0 + Math.random() * 8.0, 0),
      targetY,
      hasExploded: false,
      baseColor: preset.base,
      accentColor: preset.accent
    };

    this.fireworkShells.push(shell);
  }

  private explodeShell(shell: FireworkShell) {
    shell.hasExploded = true;
    const pos = shell.pos;

    // Flash illumination
    this.fireworkLight.position.set(pos.x, pos.y, pos.z + 5);
    this.fireworkLight.color.copy(shell.baseColor);
    this.fireworkLight.intensity = shell.type === 'willow' ? 18.0 : 25.0;

    const sndType = shell.type === 'willow' ? 'willow' : shell.type === 'chrysanthemum' ? 'large' : 'burst';
    soundManager.playFireworkExplosion(sndType);

    const particleCount = shell.type === 'willow' ? 260 : shell.type === 'starburst' ? 220 : 180;

    for (let i = 0; i < particleCount; i++) {
      if (this.sparks.length >= this.maxSparks) break;

      let vel = new THREE.Vector3();
      let gravity = 4.0;
      let drag = 0.95;
      let maxLife = 1.8 + Math.random() * 0.8;

      if (shell.type === 'radial' || shell.type === 'chrysanthemum') {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = 12.0 + Math.random() * 14.0;
        vel.set(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed,
          Math.sin(phi) * Math.sin(theta) * speed
        );
        drag = 0.93;
        gravity = 5.0;
      } else if (shell.type === 'willow') {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4.0 + Math.random() * 12.0;
        vel.set(Math.cos(angle) * speed, 2.0 + Math.random() * 7.0, Math.sin(angle) * speed);
        gravity = 7.5;
        drag = 0.96;
        maxLife = 2.8 + Math.random() * 1.0;
      } else if (shell.type === 'starburst') {
        const armIndex = Math.floor(Math.random() * 8);
        const baseAngle = (armIndex / 8) * Math.PI * 2;
        const jitter = (Math.random() - 0.5) * 0.3;
        const speed = 13.0 + Math.random() * 15.0;
        vel.set(Math.cos(baseAngle + jitter) * speed, Math.sin(baseAngle + jitter) * speed, (Math.random() - 0.5) * 4);
        drag = 0.92;
        gravity = 3.5;
      } else {
        const phi = Math.random() * Math.PI * 2;
        const speed = 9.0 + Math.random() * 15.0;
        vel.set(Math.cos(phi) * speed, (Math.random() - 0.2) * speed * 1.2, Math.sin(phi) * speed);
        gravity = 4.5;
        drag = 0.94;
      }

      const isBase = Math.random() > 0.45;
      const color = isBase ? shell.baseColor.clone() : shell.accentColor.clone();

      this.sparks.push({
        pos: pos.clone(),
        vel,
        color,
        size: shell.type === 'willow' ? 1.8 : 1.4,
        alpha: 1.0,
        life: 0,
        maxLife,
        decay: 1.0,
        gravity,
        drag
      });
    }
  }

  public update(delta: number) {
    // 1. Attenuate light
    if (this.fireworkLight.intensity > 0) {
      this.fireworkLight.intensity = Math.max(0, this.fireworkLight.intensity - delta * 28.0);
    }

    // 2. Animate shockwaves and mandalas
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.scale += delta * sw.speed;
      sw.mesh.scale.set(sw.scale, sw.scale, 1);
      sw.alpha = Math.max(0, 1.0 - sw.scale / sw.maxScale);
      (sw.mesh.material as THREE.MeshBasicMaterial).opacity = sw.alpha;

      if (sw.scale >= sw.maxScale) {
        this.group.remove(sw.mesh);
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Update Firework Shells
    for (let i = this.fireworkShells.length - 1; i >= 0; i--) {
      const shell = this.fireworkShells[i];
      if (!shell.hasExploded) {
        shell.pos.addScaledVector(shell.vel, delta);
        shell.vel.y -= 9.8 * delta;

        if (Math.random() > 0.35 && this.sparks.length < this.maxSparks) {
          this.sparks.push({
            pos: shell.pos.clone(),
            vel: new THREE.Vector3((Math.random() - 0.5) * 0.8, -1.5, (Math.random() - 0.5) * 0.8),
            color: new THREE.Color(0xffeedd),
            size: 1.4,
            alpha: 0.9,
            life: 0,
            maxLife: 0.4,
            decay: 1.0,
            gravity: 1.0,
            drag: 0.9
          });
        }

        if (shell.pos.y >= shell.targetY || shell.vel.y <= 0) {
          this.explodeShell(shell);
          this.fireworkShells.splice(i, 1);
        }
      }
    }

    // 4. Update Finale Auto-Progression
    if (this.isFinaleActive) {
      this.finaleTimer += delta;

      if (this.fireworkCounter === 0 && this.finaleTimer > 0.1) {
        this.launchFirework('chrysanthemum', 0, 34, -48);
        this.fireworkCounter++;
      }
      if (this.fireworkCounter === 1 && this.finaleTimer > 1.2) {
        this.launchFirework('radial', -18, 30, -42);
        this.launchFirework('turquoise', 18, 32, -42);
        this.fireworkCounter++;
      }
      if (this.fireworkCounter === 2 && this.finaleTimer > 2.5) {
        this.launchFirework('willow', 0, 38, -50);
        this.fireworkCounter++;
      }
      if (this.fireworkCounter === 3 && this.finaleTimer > 3.8) {
        this.launchFirework('starburst', -22, 36, -45);
        this.launchFirework('radial', 22, 36, -45);
        this.launchFirework('chrysanthemum', 0, 28, -38);
        this.fireworkCounter++;
      }
      if (this.fireworkCounter >= 4 && this.finaleTimer > 5.2) {
        const types: ('chrysanthemum' | 'radial' | 'starburst' | 'turquoise' | 'willow' | 'comet')[] = [
          'chrysanthemum', 'radial', 'starburst', 'turquoise', 'willow', 'comet'
        ];
        if (Math.random() < 0.32) {
          const type = types[Math.floor(Math.random() * types.length)];
          const x = (Math.random() - 0.5) * 48;
          const y = 25 + Math.random() * 16;
          this.launchFirework(type, x, y, -42 - Math.random() * 12);
        }
      }
    }

    // 5. Update Sparks & Embers buffer
    let activeSparkCount = 0;
    const posAttr = this.sparksGeo.attributes.position as THREE.BufferAttribute;
    const colAttr = this.sparksGeo.attributes.color as THREE.BufferAttribute;
    const sizeAttr = this.sparksGeo.attributes.size as THREE.BufferAttribute;

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.sparks.splice(i, 1);
        continue;
      }

      p.vel.y -= p.gravity * delta;
      p.vel.multiplyScalar(Math.pow(p.drag, delta * 60));
      p.pos.addScaledVector(p.vel, delta);

      if (p.pos.y < 0.1) {
        p.pos.y = 0.1;
        p.vel.y *= -0.3;
        p.vel.x *= 0.6;
        p.vel.z *= 0.6;
      }

      const progress = p.life / p.maxLife;
      const fade = 1.0 - progress;

      if (activeSparkCount < this.maxSparks) {
        const idx3 = activeSparkCount * 3;
        this.sparkPositions[idx3] = p.pos.x;
        this.sparkPositions[idx3 + 1] = p.pos.y;
        this.sparkPositions[idx3 + 2] = p.pos.z;

        this.sparkColors[idx3] = p.color.r * fade;
        this.sparkColors[idx3 + 1] = p.color.g * fade;
        this.sparkColors[idx3 + 2] = p.color.b * fade;

        this.sparkSizes[activeSparkCount] = p.size * fade;

        activeSparkCount++;
      }
    }

    for (let i = activeSparkCount; i < this.maxSparks; i++) {
      this.sparkSizes[i] = 0;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  }

  public reset() {
    this.isFinaleActive = false;
    this.finaleTimer = 0;
    this.fireworkCounter = 0;
    this.sparks = [];
    this.fireworkShells = [];
    this.shockwaves.forEach((sw) => {
      this.group.remove(sw.mesh);
    });
    this.shockwaves = [];
    this.fireworkLight.intensity = 0;

    this.sparkSizes.fill(0);
    (this.sparksGeo.attributes.size as THREE.BufferAttribute).needsUpdate = true;
  }
}
