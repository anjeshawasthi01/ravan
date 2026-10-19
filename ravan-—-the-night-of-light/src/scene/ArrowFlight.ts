import * as THREE from 'three';
import { soundManager } from '../audio/SoundManager';

export class ArrowFlight {
  public group: THREE.Group;
  public isActive: boolean = false;
  public flightProgress: number = 0; // 0.0 to 1.0
  private flightDuration: number = 0.95; // Crisp, high-speed impact (~0.95s)

  // Trajectory points (Cubic Bézier curve)
  private p0: THREE.Vector3 = new THREE.Vector3();
  private p1: THREE.Vector3 = new THREE.Vector3();
  private p2: THREE.Vector3 = new THREE.Vector3();
  private p3: THREE.Vector3 = new THREE.Vector3();

  // 3D Flying Arrow
  public arrowMesh: THREE.Group;
  private arrowHeadLight: THREE.PointLight;
  private spinningRing1: THREE.Mesh;
  private spinningRing2: THREE.Mesh;
  private solarAura: THREE.Mesh;

  // Golden particle ribbon / trail behind the arrow
  private trailLine: THREE.Line;
  private trailGeo: THREE.BufferGeometry;
  private trailPoints: THREE.Vector3[] = [];
  private maxTrailPoints: number = 42;

  public onHitRavan?: (hitPos: THREE.Vector3) => void;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    this.arrowMesh = new THREE.Group();

    // Shaft - dark teak with gold filigree
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 1.4, 10),
      new THREE.MeshStandardMaterial({ color: 0x3d1d0c, roughness: 0.35, metalness: 0.2 })
    );
    shaft.rotation.x = Math.PI / 2;
    this.arrowMesh.add(shaft);

    // Glowing Golden Arrowhead (Arrow of Dharma)
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xfff6cf,
      emissive: 0xf59e0b,
      emissiveIntensity: 3.5,
      metalness: 0.95,
      roughness: 0.1
    });
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.32, 6), headMat);
    head.rotation.x = -Math.PI / 2;
    head.position.z = -0.78;
    this.arrowMesh.add(head);

    // Luminous Solar Core / Halo
    const auraGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0xffe259,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.solarAura = new THREE.Mesh(auraGeo, auraMat);
    this.solarAura.position.z = -0.78;
    this.arrowMesh.add(this.solarAura);

    // Spinning golden celestial energy rings
    const ringGeo = new THREE.TorusGeometry(0.12, 0.014, 8, 20);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd23f,
      blending: THREE.AdditiveBlending
    });
    this.spinningRing1 = new THREE.Mesh(ringGeo, ringMat);
    this.spinningRing1.position.z = -0.35;
    this.arrowMesh.add(this.spinningRing1);

    this.spinningRing2 = new THREE.Mesh(ringGeo, ringMat);
    this.spinningRing2.position.z = 0.05;
    this.spinningRing2.scale.setScalar(0.75);
    this.arrowMesh.add(this.spinningRing2);

    // Brilliant golden point light illuminating ground/sky in flight
    this.arrowHeadLight = new THREE.PointLight(0xffb703, 4.5, 18);
    this.arrowHeadLight.position.z = -0.78;
    this.arrowMesh.add(this.arrowHeadLight);

    // Fletching (peacock green and saffron feathers)
    const fletchMat1 = new THREE.MeshBasicMaterial({ color: 0x059669, side: THREE.DoubleSide });
    const fletchMat2 = new THREE.MeshBasicMaterial({ color: 0xd97706, side: THREE.DoubleSide });
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.3), i % 2 === 0 ? fletchMat1 : fletchMat2);
      f.position.set(Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0.65);
      f.rotation.z = a;
      this.arrowMesh.add(f);
    }

    this.group.add(this.arrowMesh);

    // Golden Ribbon Particle Trail
    this.trailGeo = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(this.maxTrailPoints * 3);
    this.trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

    const trailMat = new THREE.LineBasicMaterial({
      color: 0xffd277,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      linewidth: 4
    });
    this.trailLine = new THREE.Line(this.trailGeo, trailMat);
    this.group.add(this.trailLine);
  }

  public launch(startPos: THREE.Vector3, aimDirection: THREE.Vector3, targetPos: THREE.Vector3) {
    this.isActive = true;
    this.flightProgress = 0;
    this.group.visible = true;
    this.trailPoints = [];

    // Calculate Bézier curve points:
    // P0: Starting position at bow
    this.p0.copy(startPos);

    // P1: Initial burst along player's aim direction
    const aimLength = 9.0;
    this.p1.copy(startPos).addScaledVector(aimDirection, aimLength);
    // Graceful celestial arch upward
    this.p1.y = Math.max(this.p1.y, startPos.y + 3.0);

    // P2: High soaring apex curving gracefully down toward Ravan's chest
    this.p2.copy(targetPos).add(new THREE.Vector3(0, 5.0, 12.0));

    // P3: Heart of Ravan
    this.p3.copy(targetPos);

    soundManager.playArrowFlight();
  }

  public update(delta: number): boolean {
    if (!this.isActive) return false;

    this.flightProgress += delta / this.flightDuration;

    // Spin celestial energy rings
    this.spinningRing1.rotation.z += delta * 14.0;
    this.spinningRing1.rotation.x += delta * 6.0;
    this.spinningRing2.rotation.z -= delta * 12.0;

    // Pulse solar aura
    const pulse = 1.0 + Math.sin(this.flightProgress * 25.0) * 0.2;
    this.solarAura.scale.setScalar(pulse);

    if (this.flightProgress >= 1.0) {
      // Arrived at target: GUARANTEED HIT
      this.flightProgress = 1.0;
      this.isActive = false;
      this.group.visible = false;
      this.onHitRavan?.(this.p3);
      soundManager.playImpact();
      return true;
    }

    // Dynamic easing: Starts fast, soars smoothly, then drives with immense speed into target
    // Smooth bezier interpolation
    const t = this.flightProgress;
    // Cubic bezier position
    const currentPos = this.getCubicBezierPoint(t, this.p0, this.p1, this.p2, this.p3);
    this.arrowMesh.position.copy(currentPos);

    // Forward tangent alignment
    const nextT = Math.min(t + 0.02, 1.0);
    const nextPos = this.getCubicBezierPoint(nextT, this.p0, this.p1, this.p2, this.p3);
    const forward = new THREE.Vector3().subVectors(nextPos, currentPos).normalize();
    const targetLookAt = currentPos.clone().add(forward);
    this.arrowMesh.lookAt(targetLookAt);

    // Update golden trail
    this.trailPoints.unshift(currentPos.clone());
    if (this.trailPoints.length > this.maxTrailPoints) {
      this.trailPoints.pop();
    }

    const posAttr = this.trailGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < this.maxTrailPoints; i++) {
      if (i < this.trailPoints.length) {
        posAttr.setXYZ(i, this.trailPoints[i].x, this.trailPoints[i].y, this.trailPoints[i].z);
      } else if (this.trailPoints.length > 0) {
        const last = this.trailPoints[this.trailPoints.length - 1];
        posAttr.setXYZ(i, last.x, last.y, last.z);
      }
    }
    posAttr.needsUpdate = true;

    return false;
  }

  private getCubicBezierPoint(
    t: number,
    p0: THREE.Vector3,
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    p3: THREE.Vector3
  ): THREE.Vector3 {
    const oneMinusT = 1.0 - t;
    const oneMinusT2 = oneMinusT * oneMinusT;
    const oneMinusT3 = oneMinusT2 * oneMinusT;
    const t2 = t * t;
    const t3 = t2 * t;

    const result = new THREE.Vector3();
    result.addScaledVector(p0, oneMinusT3);
    result.addScaledVector(p1, 3.0 * oneMinusT2 * t);
    result.addScaledVector(p2, 3.0 * oneMinusT * t2);
    result.addScaledVector(p3, t3);
    return result;
  }

  public getCurrentPosition(): THREE.Vector3 {
    return this.arrowMesh.position;
  }

  public reset() {
    this.isActive = false;
    this.group.visible = false;
    this.flightProgress = 0;
    this.trailPoints = [];
  }
}
