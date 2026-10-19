import * as THREE from 'three';
import { soundManager } from '../audio/SoundManager';

export class RavanEffigy {
  public group: THREE.Group;
  public targetPoint: THREE.Vector3;
  public stagePosition: THREE.Vector3;

  // 10 heads references
  private headMeshes: THREE.Group[] = [];
  private headFlames: THREE.Group[] = [];
  private crownMeshes: THREE.Mesh[] = [];

  // Body parts
  private torsoMesh!: THREE.Mesh;
  private dhotiMesh!: THREE.Mesh;
  private armorPlate!: THREE.Mesh;
  private armsGroup: THREE.Group = new THREE.Group();
  private bodyFlames: THREE.Group = new THREE.Group();

  // Stage and decorations
  private stageGroup: THREE.Group = new THREE.Group();
  private stageLight!: THREE.PointLight;
  private fireLight!: THREE.PointLight;

  // Materials to animate emissive glow & burn
  private rArmMat!: THREE.MeshStandardMaterial;
  private torsoMat!: THREE.MeshStandardMaterial;
  private faceMat!: THREE.MeshStandardMaterial;
  private goldMat!: THREE.MeshStandardMaterial;
  private crownMat!: THREE.MeshStandardMaterial;

  // Burn state
  public isIgnited: boolean = false;
  private burnTimer: number = 0;
  private headIgniteTimes: number[] = [];
  private headsIgnited: boolean[] = new Array(10).fill(false);
  private bodyIgnited: boolean = false;
  private stageAwakened: boolean = false;
  public onBurnMilestone?: (stage: 'phase1' | 'heads' | 'body' | 'finale') => void;
  public onHeadIgnited?: (headIndex: number, worldPos: THREE.Vector3) => void;

  constructor() {
    this.group = new THREE.Group();
    this.stagePosition = new THREE.Vector3(0, 0, -42);
    this.group.position.copy(this.stagePosition);
    // Upper torso target point in world coordinates
    this.targetPoint = new THREE.Vector3(0, 8.8, -42);

    this.initMaterials();
    this.buildCeremonialStage();
    this.buildEffigyBody();
    this.buildTenHeads();

    // Attach body flames container
    this.group.add(this.bodyFlames);
  }

  private initMaterials() {
    // Rich PBR materials
    this.faceMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // Traditional stylized blue skin of royal demon king
      roughness: 0.5,
      metalness: 0.1
    });

    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.25
    });

    this.crownMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.2,
      metalness: 0.9,
      roughness: 0.2
    });

    this.torsoMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626, // Royal red silk
      roughness: 0.6,
      metalness: 0.1
    });

    this.rArmMat = new THREE.MeshStandardMaterial({
      color: 0x059669, // Emerald green sash
      roughness: 0.6
    });
  }

  private buildCeremonialStage() {
    // Stepped plinth decorated with flowers and golden fabric
    const lowerStep = new THREE.Mesh(
      new THREE.CylinderGeometry(11, 12, 1.2, 24),
      new THREE.MeshStandardMaterial({ color: 0x331c15, roughness: 0.8 })
    );
    lowerStep.position.y = 0.6;
    lowerStep.receiveShadow = true;
    this.stageGroup.add(lowerStep);

    const upperStep = new THREE.Mesh(
      new THREE.CylinderGeometry(8.5, 9.5, 1.0, 24),
      new THREE.MeshStandardMaterial({ color: 0x4a2418, roughness: 0.75 })
    );
    upperStep.position.y = 1.7;
    upperStep.receiveShadow = true;
    this.stageGroup.add(upperStep);

    // Decorative golden fringe band around the stage
    const fringe = new THREE.Mesh(
      new THREE.TorusGeometry(8.6, 0.25, 12, 32),
      this.goldMat
    );
    fringe.rotation.x = Math.PI / 2;
    fringe.position.y = 2.15;
    this.stageGroup.add(fringe);

    // Garland of marigolds (alternating orange and yellow flowers)
    const garlandCount = 36;
    const flowerGeo = new THREE.SphereGeometry(0.28, 8, 8);
    const flowerMatO = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const flowerMatY = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    for (let i = 0; i < garlandCount; i++) {
      const a = (i / garlandCount) * Math.PI * 2;
      const fl = new THREE.Mesh(flowerGeo, i % 2 === 0 ? flowerMatO : flowerMatY);
      fl.position.set(Math.cos(a) * 8.8, 1.8 + Math.sin(i * 1.5) * 0.3, Math.sin(a) * 8.8);
      this.stageGroup.add(fl);
    }

    // Diyas (traditional clay oil lamps) around stage perimeter
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const diyaGroup = new THREE.Group();
      diyaGroup.position.set(Math.cos(a) * 8.2, 2.2, Math.sin(a) * 8.2);

      const diyaBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.12, 0.15, 8),
        new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.9 })
      );
      diyaGroup.add(diyaBase);

      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.28, 6),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      flame.position.y = 0.2;
      diyaGroup.add(flame);

      this.stageGroup.add(diyaGroup);
    }

    // Warm stage illumination
    this.stageLight = new THREE.PointLight(0xff9421, 1.8, 18);
    this.stageLight.position.set(0, 4, 3);
    this.stageGroup.add(this.stageLight);

    // Dynamic fire light (intensifies during burn)
    this.fireLight = new THREE.PointLight(0xff5500, 0, 32);
    this.fireLight.position.set(0, 9, 2);
    this.stageGroup.add(this.fireLight);

    this.group.add(this.stageGroup);
  }

  private buildEffigyBody() {
    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = 2.2; // sits flush on top of stage

    // 1. Massive Lower Garment / Dhoti (stepped flared conical silhouette)
    const dhotiGeo = new THREE.CylinderGeometry(1.4, 2.8, 4.2, 16);
    this.dhotiMesh = new THREE.Mesh(
      dhotiGeo,
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 }) // Saffron dhoti
    );
    this.dhotiMesh.position.y = 2.1;
    this.dhotiMesh.castShadow = true;
    bodyGroup.add(this.dhotiMesh);

    // Decorative golden border on dhoti
    const borderGeo = new THREE.TorusGeometry(2.8, 0.12, 8, 24);
    const border = new THREE.Mesh(borderGeo, this.goldMat);
    border.rotation.x = Math.PI / 2;
    border.position.y = 0.3;
    bodyGroup.add(border);

    // 2. Royal Torso & Chest Armor (Kavach)
    const torsoGeo = new THREE.CylinderGeometry(2.3, 1.6, 3.6, 16);
    this.torsoMesh = new THREE.Mesh(torsoGeo, this.torsoMat);
    this.torsoMesh.position.y = 5.6;
    this.torsoMesh.castShadow = true;
    bodyGroup.add(this.torsoMesh);

    // Golden Kavach (Chestplate Armor)
    const armorGeo = new THREE.BoxGeometry(2.4, 2.2, 1.2);
    this.armorPlate = new THREE.Mesh(armorGeo, this.goldMat);
    this.armorPlate.position.set(0, 5.8, 0.9);
    bodyGroup.add(this.armorPlate);

    // Sacred Golden Necklace / Haar
    const haarGeo = new THREE.TorusGeometry(1.4, 0.16, 8, 24, Math.PI);
    const haar = new THREE.Mesh(haarGeo, this.goldMat);
    haar.position.set(0, 6.7, 1.3);
    haar.rotation.x = 0.6;
    bodyGroup.add(haar);

    // Royal Sash (Angavastram) draped across chest
    const sashGeo = new THREE.CylinderGeometry(0.35, 0.4, 4.2, 8);
    const sash = new THREE.Mesh(sashGeo, this.rArmMat);
    sash.rotation.z = 0.65;
    sash.position.set(-0.2, 5.8, 1.1);
    bodyGroup.add(sash);

    // 3. Multi-Armed Silhouette (Ceremonial weapons & gestures)
    // Left arms
    const lArm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 3.4, 8), this.faceMat);
    lArm1.position.set(-2.8, 5.8, 0);
    lArm1.rotation.z = 0.6;
    this.armsGroup.add(lArm1);

    const lArm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 3.0, 8), this.faceMat);
    lArm2.position.set(-2.4, 6.6, -0.6);
    lArm2.rotation.z = 0.9;
    this.armsGroup.add(lArm2);

    // Ceremonial Royal Khadga (Sword) held in raised left hand
    const swordBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 3.2, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 })
    );
    swordBlade.position.set(-4.2, 8.2, 0);
    swordBlade.rotation.z = -0.3;
    this.armsGroup.add(swordBlade);

    // Right arms
    const rArm1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 3.4, 8), this.faceMat);
    rArm1.position.set(2.8, 5.8, 0);
    rArm1.rotation.z = -0.6;
    this.armsGroup.add(rArm1);

    const rArm2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 3.0, 8), this.faceMat);
    rArm2.position.set(2.4, 6.6, -0.6);
    rArm2.rotation.z = -0.9;
    this.armsGroup.add(rArm2);

    // Ceremonial Mace / Gada in right hand
    const maceShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.5, 8), this.goldMat);
    maceShaft.position.set(4.0, 6.5, 0.2);
    maceShaft.rotation.z = 0.4;
    const maceHead = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), this.goldMat);
    maceHead.position.set(4.8, 8.0, 0.2);
    this.armsGroup.add(maceShaft, maceHead);

    bodyGroup.add(this.armsGroup);
    this.group.add(bodyGroup);
  }

  private buildTenHeads() {
    // Traditional arched arrangement: 1 grand center head + 9 surrounding heads (4 on left, 5 on right / symmetrical arch)
    // Head indexes: 0 is center head (king), 1-4 left side, 5-9 right side
    const headOffsets = [
      { x: 0.0, y: 10.4, z: 0.3, scale: 1.25, isCenter: true },  // Head 0: Grand Central Head
      { x: -1.3, y: 10.2, z: 0.1, scale: 0.95, isCenter: false }, // Head 1
      { x: -2.5, y: 9.8, z: -0.2, scale: 0.85, isCenter: false }, // Head 2
      { x: -3.6, y: 9.2, z: -0.6, scale: 0.78, isCenter: false }, // Head 3
      { x: -4.6, y: 8.5, z: -1.1, scale: 0.72, isCenter: false }, // Head 4
      { x: 1.3, y: 10.2, z: 0.1, scale: 0.95, isCenter: false },  // Head 5
      { x: 2.5, y: 9.8, z: -0.2, scale: 0.85, isCenter: false },  // Head 6
      { x: 3.6, y: 9.2, z: -0.6, scale: 0.78, isCenter: false },  // Head 7
      { x: 4.6, y: 8.5, z: -1.1, scale: 0.72, isCenter: false },  // Head 8
      { x: 0.0, y: 11.9, z: -0.4, scale: 0.70, isCenter: false }  // Head 9: Top crest head (traditional 10th head atop arch)
    ];

    // Igniting order: center head first, then ripples outward
    this.headIgniteTimes = [
      1.0,  // Head 0 (Center) ignites at t = 1.0s
      1.6,  // Head 1
      2.0,  // Head 5
      2.4,  // Head 2
      2.8,  // Head 6
      3.2,  // Head 3
      3.6,  // Head 7
      4.0,  // Head 4
      4.4,  // Head 8
      4.8   // Head 9 (Top crest)
    ];

    headOffsets.forEach((cfg, idx) => {
      const headGroup = new THREE.Group();
      headGroup.position.set(cfg.x, cfg.y, cfg.z);
      headGroup.scale.setScalar(cfg.scale);

      // 1. Stylized Face / Head Shape
      const faceGeo = new THREE.SphereGeometry(0.85, 16, 16);
      faceGeo.scale(0.85, 1.0, 0.9);
      const faceMesh = new THREE.Mesh(faceGeo, this.faceMat);
      faceMesh.castShadow = true;
      headGroup.add(faceMesh);

      // 2. Elaborate Golden Mukut (Crown)
      const crownBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.82, 0.75, 0.45, 16),
        this.crownMat
      );
      crownBase.position.y = 0.85;
      headGroup.add(crownBase);

      const crownSpire = new THREE.Mesh(
        new THREE.ConeGeometry(0.7, cfg.isCenter ? 1.8 : 1.3, 8),
        this.crownMat
      );
      crownSpire.position.y = 1.6;
      headGroup.add(crownSpire);
      this.crownMeshes.push(crownSpire);

      // Jewel on crown
      const jewel = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.2, 0),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      jewel.position.set(0, 1.2, 0.7);
      headGroup.add(jewel);

      // 3. Expressive stylized facial features
      // Distinctive curved moustache (traditional regal swirled moustache)
      const stacheL = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.08, 6, 12, Math.PI * 0.75),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 })
      );
      stacheL.position.set(-0.25, -0.25, 0.72);
      stacheL.rotation.z = 0.3;
      const stacheR = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.08, 6, 12, Math.PI * 0.75),
        new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 })
      );
      stacheR.position.set(0.25, -0.25, 0.72);
      stacheR.rotation.y = Math.PI;
      stacheR.rotation.z = 0.3;
      headGroup.add(stacheL, stacheR);

      // Bold arched eyebrows
      const browMat = new THREE.MeshStandardMaterial({ color: 0x09090b });
      const browL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.08), browMat);
      browL.position.set(-0.35, 0.28, 0.7);
      browL.rotation.z = -0.2;
      const browR = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.08), browMat);
      browR.position.set(0.35, 0.28, 0.7);
      browR.rotation.z = 0.2;
      headGroup.add(browL, browR);

      // Large stylized eyes (white sclera + black pupil)
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
      const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), eyeMat);
      eyeL.position.set(-0.32, 0.12, 0.68);
      const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), pupilMat);
      pupilL.position.set(-0.32, 0.12, 0.78);

      const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), eyeMat);
      eyeR.position.set(0.32, 0.12, 0.68);
      const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), pupilMat);
      pupilR.position.set(0.32, 0.12, 0.78);

      headGroup.add(eyeL, pupilL, eyeR, pupilR);

      // Sacred Tilak on forehead
      const tilak = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.35, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xdc2626 })
      );
      tilak.position.set(0, 0.45, 0.72);
      headGroup.add(tilak);

      // Kundal (Earrings)
      const earringGeo = new THREE.TorusGeometry(0.18, 0.05, 6, 12);
      const earL = new THREE.Mesh(earringGeo, this.goldMat);
      earL.position.set(-0.82, -0.1, 0.1);
      earL.rotation.y = Math.PI / 2;
      const earR = new THREE.Mesh(earringGeo, this.goldMat);
      earR.position.set(0.82, -0.1, 0.1);
      earR.rotation.y = Math.PI / 2;
      headGroup.add(earL, earR);

      // Flame container for this head (initially hidden)
      const headFlameGroup = this.createHeadFlameGeometry(cfg.isCenter ? 1.5 : 1.1);
      headFlameGroup.position.y = 0.5;
      headFlameGroup.visible = false;
      headGroup.add(headFlameGroup);
      this.headFlames.push(headFlameGroup);

      this.headMeshes.push(headGroup);
      this.group.add(headGroup);
    });
  }

  private createHeadFlameGeometry(scale: number): THREE.Group {
    const fg = new THREE.Group();
    fg.scale.setScalar(scale);

    // Multiple layered stylized procedural flame cones & ribbons
    const flameMat1 = new THREE.MeshBasicMaterial({
      color: 0xffe259,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const flameMat2 = new THREE.MeshBasicMaterial({
      color: 0xff6b08,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const flameMat3 = new THREE.MeshBasicMaterial({
      color: 0xdc2626,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.2, 7), flameMat1);
    f1.position.y = 1.1;
    const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 7), flameMat2);
    f2.position.set(0.2, 0.9, 0.1);
    const f3 = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.6, 6), flameMat3);
    f3.position.set(-0.2, 1.3, -0.1);

    fg.add(f1, f2, f3);
    return fg;
  }

  // --- BURNING ANIMATION TRIGGER ---
  public ignite() {
    if (this.isIgnited) return;
    this.isIgnited = true;
    this.burnTimer = 0;
    this.headsIgnited.fill(false);
    this.bodyIgnited = false;
    this.stageAwakened = false;

    // Start roaring fire sound
    soundManager.startFireRoar();

    // Notify milestone phase 1: Golden impact & energy spread
    this.onBurnMilestone?.('phase1');
  }

  public update(delta: number) {
    if (!this.isIgnited) return;

    this.burnTimer += delta;

    // Phase 1 (0 to 1.0s): Golden energy ripples across body
    if (this.burnTimer < 1.0) {
      const pulse = Math.sin(this.burnTimer * 12) * 0.5 + 0.5;
      this.torsoMat.emissive.setRGB(1.0 * pulse, 0.6 * pulse, 0.1 * pulse);
      this.torsoMat.emissiveIntensity = 2.0 * pulse;
      this.fireLight.intensity = 1.5 * pulse;
    }

    // Phase 2 (1.0s to 5.2s): Ignite 10 heads in sequence
    for (let i = 0; i < 10; i++) {
      if (!this.headsIgnited[i] && this.burnTimer >= this.headIgniteTimes[i]) {
        this.headsIgnited[i] = true;
        this.headFlames[i].visible = true;
        soundManager.playHeadIgnite(i);

        const headWorldPos = new THREE.Vector3();
        this.headMeshes[i].getWorldPosition(headWorldPos);
        this.onHeadIgnited?.(i, headWorldPos);

        if (i === 0) {
          // Central head ignited
          this.onBurnMilestone?.('heads');
        }
      }

      if (this.headsIgnited[i]) {
        // Animate flame flicker
        const hf = this.headFlames[i];
        const t = this.burnTimer * 10 + i;
        hf.scale.y = (1.0 + Math.sin(t * 1.5) * 0.25) * (i === 0 ? 1.6 : 1.2);
        hf.rotation.y = Math.sin(t * 0.8) * 0.3;
        hf.rotation.z = Math.cos(t * 1.1) * 0.15;
      }
    }

    // Phase 3 (3.5s onwards): Body catches fire & spreads
    if (this.burnTimer >= 3.5 && !this.bodyIgnited) {
      this.bodyIgnited = true;
      this.createBodyFlames();
      this.onBurnMilestone?.('body');
    }

    if (this.bodyIgnited) {
      // Body flames dancing & growing
      this.bodyFlames.children.forEach((child, idx) => {
        const t = this.burnTimer * 8 + idx * 1.2;
        child.scale.y = 1.0 + Math.sin(t) * 0.35;
        child.scale.x = 1.0 + Math.cos(t * 0.9) * 0.2;
      });

      // Gradually char and glow effigy materials
      const burnProgress = Math.min((this.burnTimer - 3.5) / 4.0, 1.0);
      this.torsoMat.emissive.setRGB(1.0, 0.4 + 0.5 * (1 - burnProgress), 0.1);
      this.torsoMat.emissiveIntensity = 1.2 + Math.sin(this.burnTimer * 6) * 0.6;
      this.crownMat.emissiveIntensity = 0.8 + Math.sin(this.burnTimer * 8) * 0.4;

      this.fireLight.intensity = THREE.MathUtils.lerp(this.fireLight.intensity, 6.0, delta * 2.0);
      this.stageLight.color.setRGB(1.0, 0.45 + Math.sin(this.burnTimer * 5) * 0.1, 0.1);
    }

    // Phase 4 (5.5s onwards): Festival awakens with stage pyrotechnics & builds to fireworks
    if (this.burnTimer >= 5.5 && !this.stageAwakened) {
      this.stageAwakened = true;
      this.stageLight.intensity = 3.5;
      this.onBurnMilestone?.('finale');
    }
  }

  private createBodyFlames() {
    // 5 primary stylized flame clusters on torso, dhoti, and arms
    const flameMatOrange = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const flameMatGold = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const positions = [
      { x: 0, y: 7.2, z: 1.0, s: 2.2 },
      { x: -1.2, y: 8.0, z: 0.6, s: 1.8 },
      { x: 1.2, y: 8.0, z: 0.6, s: 1.8 },
      { x: 0, y: 5.0, z: 1.2, s: 2.4 },
      { x: -2.0, y: 7.5, z: 0.2, s: 1.5 },
      { x: 2.0, y: 7.5, z: 0.2, s: 1.5 }
    ];

    positions.forEach((p, idx) => {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.8 * p.s, 2.8 * p.s, 7),
        idx % 2 === 0 ? flameMatOrange : flameMatGold
      );
      cone.position.set(p.x, p.y, p.z);
      this.bodyFlames.add(cone);
    });
  }

  // --- RESET FOR REPLAY WITHOUT PAGE RELOAD ---
  public reset() {
    this.isIgnited = false;
    this.burnTimer = 0;
    this.headsIgnited.fill(false);
    this.bodyIgnited = false;
    this.stageAwakened = false;

    // Hide head flames
    this.headFlames.forEach((hf) => {
      hf.visible = false;
    });

    // Clear body flames
    while (this.bodyFlames.children.length > 0) {
      this.bodyFlames.remove(this.bodyFlames.children[0]);
    }

    // Reset material emissives and colors
    this.torsoMat.emissive.setRGB(0, 0, 0);
    this.torsoMat.emissiveIntensity = 0;
    this.crownMat.emissive.setRGB(0.85, 0.46, 0.02);
    this.crownMat.emissiveIntensity = 0.2;

    this.fireLight.intensity = 0;
    this.stageLight.intensity = 1.8;
    this.stageLight.color.setRGB(1.0, 0.58, 0.13);

    soundManager.reset();
  }
}
