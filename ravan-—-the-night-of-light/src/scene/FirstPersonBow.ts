import * as THREE from 'three';
import { soundManager } from '../audio/SoundManager';

export class FirstPersonBow {
  public group: THREE.Group;

  // Bow components
  private bowGroup: THREE.Group = new THREE.Group();
  private upperLimb!: THREE.Mesh;
  private lowerLimb!: THREE.Mesh;
  private bowGrip!: THREE.Mesh;
  private bowStringLine!: THREE.Line;
  private stringGeometry!: THREE.BufferGeometry;

  // Divine ornamentation & glow
  private runesMaterial!: THREE.MeshBasicMaterial;
  private runeMeshes: THREE.Mesh[] = [];
  private tipGlowUpper!: THREE.PointLight;
  private tipGlowLower!: THREE.PointLight;

  // Arrow on the bow
  private nockedArrow: THREE.Group = new THREE.Group();
  private arrowShaft!: THREE.Mesh;
  private arrowHead!: THREE.Mesh;
  private arrowHeadLight!: THREE.PointLight;
  private arrowHeadMat!: THREE.MeshStandardMaterial;
  private arrowAura!: THREE.Mesh;

  // Royal Arms and hands
  private leftArmGroup: THREE.Group = new THREE.Group();  // Bow-holding arm
  private rightArmGroup: THREE.Group = new THREE.Group(); // String-pulling arm

  // Animation & state
  public drawProgress: number = 0; // 0.0 (rest) to 1.0 (fully drawn)
  public isDrawing: boolean = false;
  private idleTime: number = 0;
  private recoilTime: number = 0;
  public isArrowNocked: boolean = true;

  // Rest string positions
  private readonly tipUpperZ = 0.05;
  private readonly tipLowerZ = 0.05;
  private readonly tipUpperY = 0.52;
  private readonly tipLowerY = -0.52;
  private readonly restNockZ = 0.08;

  constructor() {
    this.group = new THREE.Group();

    // Position the bow rig directly in front of the camera:
    // Slightly to the lower-left, tilted so the arrow aims dead center into the reticle!
    this.group.position.set(-0.06, -0.22, -0.52);
    // Cant the bow slightly (15 deg roll, slight inward yaw) like a heroic royal warrior
    this.group.rotation.set(-0.02, 0.06, 0.22);

    this.buildGrandBow();
    this.buildDivineArrow();
    this.buildRoyalHandsAndArms();

    this.group.add(this.bowGroup);
    this.group.add(this.nockedArrow);
    this.group.add(this.leftArmGroup);
    this.group.add(this.rightArmGroup);
  }

  private buildGrandBow() {
    // Rich royal ebony/mahogany dark wood
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x3b1d0c,
      roughness: 0.32,
      metalness: 0.18
    });

    // 24K Royal Gilded Gold (Dharma epic aesthetic)
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd23f,
      emissive: 0x996515,
      emissiveIntensity: 0.25,
      metalness: 0.92,
      roughness: 0.18
    });

    // Ruby jewel material for royal accents
    const rubyMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.3
    });

    // Luminous divine runes along the bow
    this.runesMaterial = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0.6
    });

    // --- 1. CENTRAL RISER / GRIP ---
    // Ergonomic sculpted grip
    const gripGeo = new THREE.CylinderGeometry(0.022, 0.026, 0.16, 12);
    this.bowGrip = new THREE.Mesh(gripGeo, woodMat);
    this.bowGroup.add(this.bowGrip);

    // Royal saffron & gold silk cord handle wrap
    const wrapGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.12, 12);
    const wrapMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.7,
      metalness: 0.1
    });
    const wrap = new THREE.Mesh(wrapGeo, wrapMat);
    this.bowGroup.add(wrap);

    // Ornate gold lotus collars on grip ends
    for (const y of [0.08, -0.08]) {
      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.029, 0.007, 8, 20), goldMat);
      collar.position.y = y;
      collar.rotation.x = Math.PI / 2;
      this.bowGroup.add(collar);

      // Embedded ruby jewel
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.009, 0), rubyMat);
      gem.position.set(0, y, -0.03);
      this.bowGroup.add(gem);
    }

    // --- 2. RECURVE LIMBS (CURVED FORWARD TOWARDS -Z, AWAY FROM ARCHER) ---
    // In a real bow, the grip is held forward, the limbs sweep forward into -Z,
    // and the tips recurve back toward +Z where the string rests!
    const upperCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.08, -0.01),
      new THREE.Vector3(0.005, 0.22, -0.06), // Arch forward
      new THREE.Vector3(0.008, 0.38, -0.04), // Recurve transition
      new THREE.Vector3(0, this.tipUpperY, this.tipUpperZ) // Recurve tip (holds string)
    ]);
    const upperGeo = new THREE.TubeGeometry(upperCurve, 24, 0.018, 10, false);
    this.upperLimb = new THREE.Mesh(upperGeo, woodMat);
    this.bowGroup.add(this.upperLimb);

    const lowerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.08, -0.01),
      new THREE.Vector3(0.005, -0.22, -0.06), // Arch forward
      new THREE.Vector3(0.008, -0.38, -0.04), // Recurve transition
      new THREE.Vector3(0, this.tipLowerY, this.tipLowerZ) // Recurve tip (holds string)
    ]);
    const lowerGeo = new THREE.TubeGeometry(lowerCurve, 24, 0.018, 10, false);
    this.lowerLimb = new THREE.Mesh(lowerGeo, woodMat);
    this.bowGroup.add(this.lowerLimb);

    // --- 3. ORNATE MYTHICAL PEACOCK/MAKAR GOLD FINIALS AT TIPS ---
    for (const [y, rotX, isUpper] of [
      [this.tipUpperY, -0.3, true],
      [this.tipLowerY, Math.PI + 0.3, false]
    ] as [number, number, boolean][]) {
      const tipGroup = new THREE.Group();
      tipGroup.position.set(0, y, isUpper ? this.tipUpperZ : this.tipLowerZ);
      tipGroup.rotation.x = rotX;

      // Golden ornate finial crest
      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.09, 8), goldMat);
      finial.position.y = 0.04;
      tipGroup.add(finial);

      // Lotus blossom flare
      const lotus = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.006, 6, 12), goldMat);
      tipGroup.add(lotus);

      this.bowGroup.add(tipGroup);
    }

    // --- 4. DIVINE RUNIC GOLDEN INLAYS ALONG LIMBS ---
    for (let i = 0; i < 5; i++) {
      const uY = 0.12 + i * 0.07;
      const rMesh1 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.005), this.runesMaterial);
      rMesh1.position.set(0, uY, -0.035 - i * 0.005);
      this.bowGroup.add(rMesh1);
      this.runeMeshes.push(rMesh1);

      const lY = -0.12 - i * 0.07;
      const rMesh2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.005), this.runesMaterial);
      rMesh2.position.set(0, lY, -0.035 - i * 0.005);
      this.bowGroup.add(rMesh2);
      this.runeMeshes.push(rMesh2);
    }

    // Restrained tip light aura
    this.tipGlowUpper = new THREE.PointLight(0xffd23f, 0.4, 0.8);
    this.tipGlowUpper.position.set(0, this.tipUpperY, this.tipUpperZ);
    this.bowGroup.add(this.tipGlowUpper);

    this.tipGlowLower = new THREE.PointLight(0xffd23f, 0.4, 0.8);
    this.tipGlowLower.position.set(0, this.tipLowerY, this.tipLowerZ);
    this.bowGroup.add(this.tipGlowLower);

    // --- 5. LUMINOUS CELESTIAL BOWSTRING ---
    this.stringGeometry = new THREE.BufferGeometry();
    const stringPositions = new Float32Array([
      0, this.tipUpperY, this.tipUpperZ, // Upper tip
      0, 0.0, this.restNockZ,            // Center nock point
      0, this.tipLowerY, this.tipLowerZ  // Lower tip
    ]);
    this.stringGeometry.setAttribute('position', new THREE.BufferAttribute(stringPositions, 3));

    const stringMat = new THREE.LineBasicMaterial({
      color: 0xfff6cf,
      linewidth: 3
    });
    this.bowStringLine = new THREE.Line(this.stringGeometry, stringMat);
    this.bowGroup.add(this.bowStringLine);
  }

  private buildDivineArrow() {
    // Ornate dark teakwood shaft with golden spiral filigree
    const shaftGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.85, 10);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0x2b1408,
      roughness: 0.4,
      metalness: 0.1
    });
    this.arrowShaft = new THREE.Mesh(shaftGeo, shaftMat);
    // Cylinder is along Y; rotate by +90 deg so it points forward along -Z
    this.arrowShaft.rotation.x = Math.PI / 2;
    this.arrowShaft.position.set(0, 0.01, -0.32);
    this.nockedArrow.add(this.arrowShaft);

    // Golden bands along the arrow shaft
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd23f, metalness: 0.9, roughness: 0.2 });
    for (let i = 0; i < 4; i++) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.015, 8), goldMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.01, -0.15 - i * 0.15);
      this.nockedArrow.add(ring);
    }

    // --- MAGICAL 3-BLADED TRISHULA/DHARMA ARROWHEAD ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.01, -0.74);

    this.arrowHeadMat = new THREE.MeshStandardMaterial({
      color: 0xfff08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.8,
      metalness: 0.95,
      roughness: 0.15
    });

    // Central piercing spear tip (pointing along -Z)
    const centralTip = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.11, 4), this.arrowHeadMat);
    centralTip.rotation.x = -Math.PI / 2; // Apex along -Z
    headGroup.add(centralTip);

    // Flanking ceremonial trident blades
    for (const angle of [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3]) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.035, 0.08), goldMat);
      blade.position.set(Math.cos(angle) * 0.018, Math.sin(angle) * 0.018, 0.03);
      headGroup.add(blade);
    }

    // Ethereal glowing energy halo around the arrowhead
    const auraGeo = new THREE.SphereGeometry(0.065, 12, 12);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xffe259,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.arrowAura = new THREE.Mesh(auraGeo, auraMat);
    headGroup.add(this.arrowAura);

    // Glowing point light on arrowhead
    this.arrowHeadLight = new THREE.PointLight(0xffb703, 1.2, 2.2);
    headGroup.add(this.arrowHeadLight);

    this.nockedArrow.add(headGroup);

    // --- ROYAL PEACOCK & SAFFRON FLETCHINGS ---
    const fletchMat1 = new THREE.MeshStandardMaterial({
      color: 0x059669, // Emerald peacock green
      side: THREE.DoubleSide,
      roughness: 0.6
    });
    const fletchMat2 = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Saffron orange
      side: THREE.DoubleSide,
      roughness: 0.6
    });

    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const fletch = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.12), i % 2 === 0 ? fletchMat1 : fletchMat2);
      fletch.position.set(Math.cos(a) * 0.016, Math.sin(a) * 0.016 + 0.01, 0.04);
      fletch.rotation.z = a;
      this.nockedArrow.add(fletch);
    }
  }

  private buildRoyalHandsAndArms() {
    // Warm regal Indian skin tone
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xcd854e,
      roughness: 0.62,
      metalness: 0.06
    });

    // Royal gold jewelry (Kadas / Bangles)
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd23f,
      metalness: 0.95,
      roughness: 0.2
    });

    // Royal crimson & saffron silk sleeve
    const silkSleeveMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Deep royal crimson
      roughness: 0.8
    });

    // --- LEFT ARM (Holding the bow handle) ---
    // Forearm coming from lower left up to bow grip
    const lForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.052, 0.38, 12), skinMat);
    lForearm.position.set(-0.10, -0.16, 0.12);
    lForearm.rotation.set(0.65, 0.25, -0.65);
    this.leftArmGroup.add(lForearm);

    // Royal Silk Sleeve cuff
    const lSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.058, 0.14, 12), silkSleeveMat);
    lSleeve.position.set(-0.14, -0.22, 0.18);
    lSleeve.rotation.set(0.65, 0.25, -0.65);
    this.leftArmGroup.add(lSleeve);

    // Heavy Royal Golden Kada (Armlet with embossed lion motifs)
    const lKada = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.012, 8, 16), goldMat);
    lKada.position.set(-0.06, -0.10, 0.06);
    lKada.rotation.set(0.65, 0.25, -0.65);
    this.leftArmGroup.add(lKada);

    // Left Hand gripping the bow handle
    const lPalm = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), skinMat);
    lPalm.position.set(0, 0, 0);
    this.leftArmGroup.add(lPalm);

    // Wrapped fingers around the wood
    for (let f = 0; f < 4; f++) {
      const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.008, 0.05, 6), skinMat);
      finger.position.set(-0.005, 0.035 - f * 0.022, -0.02);
      finger.rotation.z = Math.PI / 2;
      this.leftArmGroup.add(finger);
    }

    // --- RIGHT ARM (Pulls string & nock) ---
    // Forearm extending from bottom-right up to nock point
    const rForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.052, 0.38, 12), skinMat);
    rForearm.position.set(0.12, -0.16, 0.22);
    rForearm.rotation.set(0.7, -0.25, 0.65);
    this.rightArmGroup.add(rForearm);

    // Right Royal Silk Sleeve cuff
    const rSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.058, 0.14, 12), silkSleeveMat);
    rSleeve.position.set(0.16, -0.22, 0.28);
    rSleeve.rotation.set(0.7, -0.25, 0.65);
    this.rightArmGroup.add(rSleeve);

    // Right Royal Gold Kada
    const rKada = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.012, 8, 16), goldMat);
    rKada.position.set(0.08, -0.10, 0.16);
    rKada.rotation.set(0.7, -0.25, 0.65);
    this.rightArmGroup.add(rKada);

    // Right Hand pulling the nock & string
    const rPalm = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 8), skinMat);
    rPalm.position.set(0, 0.01, this.restNockZ);
    this.rightArmGroup.add(rPalm);

    // Drawing fingers pinching the arrow nock
    const rIndex = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.008, 0.045, 6), skinMat);
    rIndex.position.set(0.012, 0.02, this.restNockZ + 0.01);
    rIndex.rotation.x = 0.5;
    const rThumb = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.009, 0.04, 6), skinMat);
    rThumb.position.set(-0.012, 0.015, this.restNockZ);
    rThumb.rotation.y = 0.8;
    this.rightArmGroup.add(rIndex, rThumb);
  }

  // --- DRAW & RELEASE CONTROLS ---
  public startDrawing() {
    if (!this.isArrowNocked) return;
    this.isDrawing = true;
    soundManager.startBowDraw();
  }

  public cancelDrawing() {
    this.isDrawing = false;
    soundManager.stopBowDraw();
  }

  public releaseArrow(): boolean {
    if (this.drawProgress < 0.15 || !this.isArrowNocked) {
      this.cancelDrawing();
      return false;
    }

    this.isDrawing = false;
    this.isArrowNocked = false;
    this.nockedArrow.visible = false;
    this.recoilTime = 0.22; // High-energy snap recoil

    soundManager.playBowRelease();

    // Reset draw progress & string
    this.drawProgress = 0;
    this.updateStringGeometry(0);

    return true;
  }

  public nockNewArrow() {
    this.isArrowNocked = true;
    this.nockedArrow.visible = true;
    this.drawProgress = 0;
    this.updateStringGeometry(0);
    this.nockedArrow.position.z = 0;
    this.rightArmGroup.position.z = 0;
  }

  private updateStringGeometry(drawDist: number) {
    const pos = this.stringGeometry.attributes.position as THREE.BufferAttribute;
    // Vertex 0: Upper tip flexes slightly inward & forward
    pos.setXYZ(0, 0, this.tipUpperY - drawDist * 0.03, this.tipUpperZ - drawDist * 0.02);
    // Vertex 1: Nock center pulled BACK toward player (+Z)
    pos.setXYZ(1, 0, 0.01, this.restNockZ + drawDist);
    // Vertex 2: Lower tip flexes
    pos.setXYZ(2, 0, this.tipLowerY + drawDist * 0.03, this.tipLowerZ - drawDist * 0.02);
    pos.needsUpdate = true;
  }

  public update(delta: number) {
    this.idleTime += delta;

    // 1. Natural warrior breathing sway
    const breathY = Math.sin(this.idleTime * 2.2) * 0.004;
    const breathX = Math.cos(this.idleTime * 1.5) * 0.0025;

    // 2. Draw charge calculation
    if (this.isDrawing && this.isArrowNocked) {
      // Rapid, responsive pull (~0.65s to full power)
      this.drawProgress = Math.min(this.drawProgress + delta * 1.55, 1.0);
    } else if (!this.isDrawing && this.drawProgress > 0) {
      this.drawProgress = Math.max(this.drawProgress - delta * 4.5, 0);
    }

    // Maximum string draw distance (meters)
    const maxDraw = 0.35;
    const currentDraw = this.drawProgress * maxDraw;

    this.updateStringGeometry(currentDraw);

    // Pull back right arm and nocked arrow with the string along +Z
    this.rightArmGroup.position.z = currentDraw;
    this.rightArmGroup.position.x = currentDraw * 0.12;
    this.nockedArrow.position.z = currentDraw;

    // Bow limb flex
    const flex = this.drawProgress * 0.09;
    this.upperLimb.rotation.z = -flex;
    this.lowerLimb.rotation.z = flex;

    // Divine Runes Glow & Arrowhead light intensify with draw charge!
    if (this.runesMaterial) {
      this.runesMaterial.opacity = 0.4 + this.drawProgress * 0.6;
    }

    if (this.isArrowNocked) {
      const glow = 1.5 + this.drawProgress * 3.5;
      this.arrowHeadMat.emissiveIntensity = glow;
      this.arrowHeadLight.intensity = 1.0 + this.drawProgress * 2.5;

      // Aura pulses and expands
      const auraScale = 1.0 + this.drawProgress * 0.8 + Math.sin(this.idleTime * 12) * 0.15;
      this.arrowAura.scale.setScalar(auraScale);
    }

    // 3. Recoil handling upon firing
    let recoilOffsetZ = 0;
    let recoilPitch = 0;
    if (this.recoilTime > 0) {
      this.recoilTime -= delta;
      const t = this.recoilTime / 0.22;
      recoilOffsetZ = Math.sin(t * Math.PI) * 0.05;
      recoilPitch = Math.sin(t * Math.PI) * 0.06;
    }

    // Apply combined transform
    this.group.position.set(
      -0.06 + breathX,
      -0.22 + breathY,
      -0.52 + recoilOffsetZ
    );
    this.group.rotation.set(-0.02 + recoilPitch, 0.06, 0.22);
  }

  public getWorldArrowLaunchPoint(): THREE.Vector3 {
    // Arrow tip world position when released
    const v = new THREE.Vector3(0, 0.01, -0.74);
    this.nockedArrow.localToWorld(v);
    return v;
  }
}
