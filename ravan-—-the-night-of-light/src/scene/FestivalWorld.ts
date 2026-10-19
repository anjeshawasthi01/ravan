import * as THREE from 'three';

export class FestivalWorld {
  public group: THREE.Group;
  private lanterns: THREE.Mesh[] = [];
  private clouds: THREE.Mesh[] = [];
  private fairyLightBulbs: THREE.Mesh[] = [];
  private fairyLightMaterial!: THREE.MeshBasicMaterial;
  private time: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.createSkyAndMoon();
    this.createGroundAndRangoli();
    this.createFestivalStalls();
    this.createFestoonLights();
    this.createDistantScenery();
    this.createSpectators();
    this.createFloatingLanterns();
  }

  private createSkyAndMoon() {
    // 1. Sky Dome with rich indigo/midnight gradient
    const skyGeo = new THREE.SphereGeometry(180, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x040614) },
        midColor: { value: new THREE.Color(0x0c1333) },
        horizonColor: { value: new THREE.Color(0x1a1236) },
        warmGlow: { value: new THREE.Color(0x401f28) }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 horizonColor;
        uniform vec3 warmGlow;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          vec3 sky = mix(horizonColor, midColor, max(0.0, h * 2.2));
          sky = mix(sky, topColor, max(0.0, (h - 0.35) * 1.5));
          if (h < 0.25) {
            sky = mix(warmGlow, sky, max(0.0, h * 4.0));
          }
          gl_FragColor = vec4(sky, 1.0);
        }
      `
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(skyMesh);

    // 2. Stars buffer
    const starCount = 380;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 160;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = Math.abs(r * Math.cos(phi)) + 15; // keep in sky
      const z = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3] = x;
      starPos[i * 3 + 1] = y;
      starPos[i * 3 + 2] = z;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xfff6cf,
      size: 0.9,
      transparent: true,
      opacity: 0.85
    });
    const stars = new THREE.Points(starGeo, starMat);
    this.group.add(stars);

    // 3. Stylized Moon
    const moonGroup = new THREE.Group();
    moonGroup.position.set(-35, 42, -90);

    const moonGeo = new THREE.SphereGeometry(7, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xfff3d1,
      emissive: 0xffe29a,
      emissiveIntensity: 0.75,
      roughness: 0.4
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moonGroup.add(moon);

    // Moon halo glow
    const haloGeo = new THREE.PlaneGeometry(28, 28);
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 128;
    haloCanvas.height = 128;
    const hctx = haloCanvas.getContext('2d')!;
    const grad = hctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255, 238, 180, 0.45)');
    grad.addColorStop(0.4, 'rgba(255, 210, 130, 0.18)');
    grad.addColorStop(1, 'rgba(255, 200, 100, 0)');
    hctx.fillStyle = grad;
    hctx.fillRect(0, 0, 128, 128);
    const haloTex = new THREE.CanvasTexture(haloCanvas);
    haloTex.colorSpace = THREE.SRGBColorSpace;

    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTex,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.z = -0.5;
    moonGroup.add(halo);

    this.group.add(moonGroup);

    // 4. Soft Stylized Clouds
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0x30255c,
      roughness: 0.9,
      transparent: true,
      opacity: 0.45,
      depthWrite: false
    });
    for (let i = 0; i < 9; i++) {
      const cGroup = new THREE.Group();
      const parts = 4 + Math.floor(Math.random() * 4);
      for (let p = 0; p < parts; p++) {
        const rad = 4 + Math.random() * 5;
        const puff = new THREE.Mesh(new THREE.SphereGeometry(rad, 12, 12), cloudMat);
        puff.position.set((p - parts / 2) * 5, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3);
        puff.scale.set(1.4, 0.6, 0.8);
        cGroup.add(puff);
      }
      cGroup.position.set(-80 + i * 22, 28 + (i % 3) * 6, -70 - (i % 4) * 12);
      this.clouds.push(cGroup as unknown as THREE.Mesh);
      this.group.add(cGroup);
    }
  }

  private createGroundAndRangoli() {
    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
    // Displace slightly for handcrafted natural earthen ground
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      if (dist > 18) {
        pos.setZ(i, Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.35);
      }
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x221714,
      roughness: 0.88,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.group.add(ground);

    // Ceremonial Pathway
    const pathGeo = new THREE.PlaneGeometry(12, 55);
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x3d271e,
      roughness: 0.82,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.02, -18);
    path.receiveShadow = true;
    this.group.add(path);

    // Procedural Rangoli in the courtyard center
    const rangoliCanvas = document.createElement('canvas');
    rangoliCanvas.width = 512;
    rangoliCanvas.height = 512;
    const rctx = rangoliCanvas.getContext('2d')!;

    // Transparent canvas with intricate Dussehra Rangoli pattern
    rctx.clearRect(0, 0, 512, 512);
    const cx = 256;
    const cy = 256;

    // Outer rings
    rctx.strokeStyle = '#f59e0b'; // amber
    rctx.lineWidth = 6;
    rctx.beginPath();
    rctx.arc(cx, cy, 230, 0, Math.PI * 2);
    rctx.stroke();

    rctx.strokeStyle = '#dc2626'; // vermilion red
    rctx.lineWidth = 8;
    rctx.beginPath();
    rctx.arc(cx, cy, 210, 0, Math.PI * 2);
    rctx.stroke();

    // Petal ring
    const petals = 16;
    for (let i = 0; i < petals; i++) {
      const angle = (i * Math.PI * 2) / petals;
      const px = cx + Math.cos(angle) * 155;
      const py = cy + Math.sin(angle) * 155;
      rctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#f87171';
      rctx.beginPath();
      rctx.arc(px, py, 32, 0, Math.PI * 2);
      rctx.fill();
    }

    // Inner star & lotus
    rctx.fillStyle = '#fffbeb';
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const tipX = cx + Math.cos(a) * 110;
      const tipY = cy + Math.sin(a) * 110;
      const b1 = a + 0.35;
      const b2 = a - 0.35;
      rctx.beginPath();
      rctx.moveTo(cx, cy);
      rctx.lineTo(cx + Math.cos(b1) * 60, cy + Math.sin(b1) * 60);
      rctx.lineTo(tipX, tipY);
      rctx.lineTo(cx + Math.cos(b2) * 60, cy + Math.sin(b2) * 60);
      rctx.closePath();
      rctx.fill();
    }

    // Center Diya motif
    rctx.fillStyle = '#d97706';
    rctx.beginPath();
    rctx.arc(cx, cy, 45, 0, Math.PI * 2);
    rctx.fill();
    rctx.fillStyle = '#fef08a';
    rctx.beginPath();
    rctx.arc(cx, cy, 22, 0, Math.PI * 2);
    rctx.fill();

    const rangoliTex = new THREE.CanvasTexture(rangoliCanvas);
    rangoliTex.colorSpace = THREE.SRGBColorSpace;

    const rangoliGeo = new THREE.PlaneGeometry(11, 11);
    const rangoliMat = new THREE.MeshStandardMaterial({
      map: rangoliTex,
      transparent: true,
      roughness: 0.7,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    const rangoli = new THREE.Mesh(rangoliGeo, rangoliMat);
    rangoli.rotation.x = -Math.PI / 2;
    rangoli.position.set(0, 0.04, -12);
    rangoli.receiveShadow = true;
    this.group.add(rangoli);

    // Scattered marigold petals
    const petalCount = 80;
    const petalGeo = new THREE.PlaneGeometry(0.25, 0.25);
    const petalMatOrange = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    const petalMatRed = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    for (let i = 0; i < petalCount; i++) {
      const p = new THREE.Mesh(petalGeo, i % 2 === 0 ? petalMatOrange : petalMatRed);
      const rad = 2 + Math.random() * 6;
      const ang = Math.random() * Math.PI * 2;
      p.rotation.x = -Math.PI / 2;
      p.rotation.z = Math.random() * Math.PI;
      p.position.set(Math.cos(ang) * rad, 0.03, -12 + Math.sin(ang) * rad);
      this.group.add(p);
    }
  }

  private createFestivalStalls() {
    // Stylized Festival Stalls lining the courtyard (left and right)
    const stallConfigs = [
      { x: -16, z: -16, rot: 0.35, color1: 0xd97706, color2: 0xfef08a },
      { x: -18, z: -28, rot: 0.25, color1: 0x059669, color2: 0xfbbf24 },
      { x: 16, z: -16, rot: -0.35, color1: 0xdc2626, color2: 0xfef08a },
      { x: 18, z: -28, rot: -0.25, color1: 0x0284c7, color2: 0xfbbf24 }
    ];

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3e2316, roughness: 0.85 });

    stallConfigs.forEach((cfg) => {
      const stallGroup = new THREE.Group();
      stallGroup.position.set(cfg.x, 0, cfg.z);
      stallGroup.rotation.y = cfg.rot;

      // Wooden counter
      const counterGeo = new THREE.BoxGeometry(4.5, 1.2, 1.8);
      const counter = new THREE.Mesh(counterGeo, woodMat);
      counter.position.y = 0.6;
      counter.castShadow = true;
      counter.receiveShadow = true;
      stallGroup.add(counter);

      // Support pillars
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8);
      const p1 = new THREE.Mesh(poleGeo, woodMat);
      p1.position.set(-2, 1.6, -0.7);
      const p2 = new THREE.Mesh(poleGeo, woodMat);
      p2.position.set(2, 1.6, -0.7);
      const p3 = new THREE.Mesh(poleGeo, woodMat);
      p3.position.set(-2, 1.6, 0.7);
      const p4 = new THREE.Mesh(poleGeo, woodMat);
      p4.position.set(2, 1.6, 0.7);
      stallGroup.add(p1, p2, p3, p4);

      // Curved Canopy Roof
      const roofGeo = new THREE.ConeGeometry(3.2, 1.2, 4);
      const roofMat = new THREE.MeshStandardMaterial({
        color: cfg.color1,
        roughness: 0.6,
        metalness: 0.1
      });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, 3.4, 0);
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1.1, 0.8, 0.9);
      roof.castShadow = true;
      stallGroup.add(roof);

      // Warm hanging lantern under canopy
      const lanternGeo = new THREE.OctahedronGeometry(0.28, 1);
      const lanternMat = new THREE.MeshStandardMaterial({
        color: 0xffd277,
        emissive: 0xffa526,
        emissiveIntensity: 1.2
      });
      const stallLantern = new THREE.Mesh(lanternGeo, lanternMat);
      stallLantern.position.set(0, 2.5, 0);
      stallGroup.add(stallLantern);

      // Point light for stall
      const light = new THREE.PointLight(0xffa233, 0.9, 8);
      light.position.set(0, 2.3, 0);
      stallGroup.add(light);

      this.group.add(stallGroup);
    });
  }

  private createFestoonLights() {
    // Strings of glowing bulbs strung between wooden poles
    this.fairyLightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd67a
    });

    const poleGeo = new THREE.CylinderGeometry(0.12, 0.15, 6, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x2e1a12, roughness: 0.9 });

    const polePositions = [
      { x: -10, z: -8 },
      { x: -13, z: -22 },
      { x: -14, z: -36 },
      { x: 10, z: -8 },
      { x: 13, z: -22 },
      { x: 14, z: -36 }
    ];

    polePositions.forEach((pos) => {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(pos.x, 3, pos.z);
      pole.castShadow = true;
      this.group.add(pole);

      // Brass top finial
      const topGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 });
      const top = new THREE.Mesh(topGeo, brassMat);
      top.position.set(pos.x, 6, pos.z);
      this.group.add(top);
    });

    // Catenary light strings connecting poles
    const connections = [
      [polePositions[0], polePositions[1]],
      [polePositions[1], polePositions[2]],
      [polePositions[3], polePositions[4]],
      [polePositions[4], polePositions[5]],
      [polePositions[0], polePositions[3]] // crossing near front
    ];

    const bulbGeo = new THREE.SphereGeometry(0.14, 8, 8);

    connections.forEach(([p1, p2]) => {
      const bulbCount = 9;
      for (let i = 0; i <= bulbCount; i++) {
        const t = i / bulbCount;
        const x = p1.x + (p2.x - p1.x) * t;
        const z = p1.z + (p2.z - p1.z) * t;
        // sag in middle (catenary curve)
        const sag = Math.sin(t * Math.PI) * 1.1;
        const y = 5.6 - sag;

        const bulb = new THREE.Mesh(bulbGeo, this.fairyLightMaterial);
        bulb.position.set(x, y, z);
        this.fairyLightBulbs.push(bulb);
        this.group.add(bulb);
      }
    });

    // Add a few subtle warm point lights along festoon lines
    const pLight1 = new THREE.PointLight(0xffa233, 1.2, 16);
    pLight1.position.set(0, 5, -8);
    this.group.add(pLight1);

    const pLight2 = new THREE.PointLight(0xff9421, 1.0, 16);
    pLight2.position.set(-11, 4.5, -22);
    this.group.add(pLight2);

    const pLight3 = new THREE.PointLight(0xff9421, 1.0, 16);
    pLight3.position.set(11, 4.5, -22);
    this.group.add(pLight3);
  }

  private createDistantScenery() {
    // Distant stylized temple silhouettes and hill outlines framing the horizon
    const hillMat = new THREE.MeshStandardMaterial({
      color: 0x0c0c20,
      roughness: 0.95
    });

    const hill1 = new THREE.Mesh(new THREE.ConeGeometry(55, 26, 16), hillMat);
    hill1.position.set(-60, 6, -85);
    hill1.scale.set(1.4, 1.0, 0.8);
    this.group.add(hill1);

    const hill2 = new THREE.Mesh(new THREE.ConeGeometry(65, 30, 16), hillMat);
    hill2.position.set(65, 8, -90);
    hill2.scale.set(1.5, 1.0, 0.7);
    this.group.add(hill2);

    // Distant decorative temple shikharas (spires) with golden glowing finials
    const spires = [
      { x: -35, z: -65, h: 14 },
      { x: 38, z: -68, h: 16 }
    ];

    spires.forEach((sp) => {
      const spireGroup = new THREE.Group();
      spireGroup.position.set(sp.x, 0, sp.z);

      const baseGeo = new THREE.BoxGeometry(6, 6, 6);
      const baseMesh = new THREE.Mesh(baseGeo, hillMat);
      baseMesh.position.y = 3;
      spireGroup.add(baseMesh);

      const shikharaGeo = new THREE.ConeGeometry(3, sp.h, 4);
      const shikhara = new THREE.Mesh(shikharaGeo, hillMat);
      shikhara.position.y = 6 + sp.h / 2;
      spireGroup.add(shikhara);

      // Kalash golden pinnacle
      const kalashGeo = new THREE.SphereGeometry(0.8, 8, 8);
      const kalashMat = new THREE.MeshBasicMaterial({ color: 0xffd269 });
      const kalash = new THREE.Mesh(kalashGeo, kalashMat);
      kalash.position.y = 6 + sp.h + 0.6;
      spireGroup.add(kalash);

      this.group.add(spireGroup);
    });
  }

  private createSpectators() {
    // Stylized silhouette spectators gathered at the periphery
    const spectatorMat = new THREE.MeshStandardMaterial({
      color: 0x14101e,
      roughness: 0.9
    });

    const specGroup = new THREE.Group();
    const count = 35;
    for (let i = 0; i < count; i++) {
      const p = new THREE.Group();
      // Body
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.5, 8), spectatorMat);
      body.position.y = 0.75;
      p.add(body);
      // Head with pagri / turban shape
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), spectatorMat);
      head.position.y = 1.65;
      p.add(head);

      // Variety: some with raised celebratory arms
      if (Math.random() > 0.5) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6), spectatorMat);
        arm.position.set(0.3, 1.8, 0);
        arm.rotation.z = -0.5;
        p.add(arm);
      }

      // Position them along left and right fences
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (12 + Math.random() * 8);
      const z = -6 - Math.random() * 26;
      p.position.set(x, 0, z);
      // Look toward Ravan (0, 0, -42)
      p.lookAt(0, 4, -42);
      specGroup.add(p);
    }
    this.group.add(specGroup);
  }

  private createFloatingLanterns() {
    // Drifting sky lanterns (kandils) in the background
    const lanternGeo = new THREE.CylinderGeometry(0.4, 0.65, 0.9, 8, 1, true);
    const lanternMat = new THREE.MeshBasicMaterial({
      color: 0xffa32b,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 22; i++) {
      const l = new THREE.Mesh(lanternGeo, lanternMat);
      const angle = (i / 22) * Math.PI * 2;
      const radius = 25 + Math.random() * 45;
      const x = Math.cos(angle) * radius;
      const z = -35 + Math.sin(angle) * radius;
      const y = 8 + Math.random() * 26;
      l.position.set(x, y, z);
      l.userData = {
        baseY: y,
        speedY: 0.3 + Math.random() * 0.4,
        swaySpeed: 0.8 + Math.random() * 0.8,
        swayAmp: 0.4 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2
      };
      this.lanterns.push(l);
      this.group.add(l);
    }
  }

  public update(delta: number) {
    this.time += delta;

    // 1. Gently drift floating lanterns
    this.lanterns.forEach((l) => {
      const ud = l.userData;
      l.position.y += ud.speedY * delta;
      l.position.x += Math.sin(this.time * ud.swaySpeed + ud.offset) * 0.015;
      // Loop lanterns back down when they get too high
      if (l.position.y > 55) {
        l.position.y = 8;
      }
    });

    // 2. Drift soft clouds
    this.clouds.forEach((c, idx) => {
      c.position.x += 0.8 * delta;
      if (c.position.x > 85) {
        c.position.x = -85;
      }
    });

    // 3. Fairy lights subtle warm flicker
    if (this.fairyLightMaterial) {
      const flicker = 0.9 + Math.sin(this.time * 4) * 0.08 + Math.cos(this.time * 9) * 0.04;
      this.fairyLightMaterial.color.setRGB(1.0 * flicker, 0.84 * flicker, 0.48 * flicker);
    }
  }
}
