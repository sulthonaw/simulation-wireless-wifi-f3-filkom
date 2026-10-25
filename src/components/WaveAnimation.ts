import * as THREE from 'three';
import type { AccessPoint } from '../types/floorplan';

export class WaveAnimationManager {
  private group: THREE.Group;
  private waveMeshes: {
    ringMesh: THREE.Mesh;
    domeMesh: THREE.Mesh;
    wireMesh: THREE.LineSegments;
    ap: AccessPoint;
    initialRadius: number;
    currentRadius: number;
    maxRadius: number;
    speed: number;
    ringMaterial: THREE.MeshBasicMaterial;
    domeMaterial: THREE.MeshBasicMaterial;
    wireMaterial: THREE.LineBasicMaterial;
  }[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'WaveAnimations';
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public updateAPs(accessPoints: AccessPoint[]): void {
    // Clear existing
    while (this.group.children.length > 0) {
      const child = this.group.children[0] as THREE.Object3D;
      this.group.remove(child);
    }
    this.waveMeshes = [];

    // Base geometries for 1-unit radius
    const ringGeo = new THREE.RingGeometry(0.92, 1.04, 48);
    ringGeo.rotateX(-Math.PI / 2); // Lay flat on floor

    // 3D downward-radiating hemispherical dome (from AP ceiling height towards floor)
    const domeGeo = new THREE.SphereGeometry(1.0, 32, 16, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55);
    const wireGeo = new THREE.WireframeGeometry(domeGeo);

    const apMountHeight = 2.45;

    for (const ap of accessPoints) {
      if (!ap.enabled) continue;

      const apColor = new THREE.Color(ap.color);

      // Create 3 concentric 3D wavefronts per active AP with staggered phases
      for (let i = 0; i < 3; i++) {
        // 1. Floor Ripple Ring
        const ringMat = new THREE.MeshBasicMaterial({
          color: apColor,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(ap.worldX, 0.08, ap.worldZ);
        this.group.add(ringMesh);

        // 2. 3D Volumetric Hemispherical Dome (Downward Radiation Pattern)
        const domeMat = new THREE.MeshBasicMaterial({
          color: apColor,
          transparent: true,
          opacity: 0.14,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const domeMesh = new THREE.Mesh(domeGeo, domeMat);
        domeMesh.position.set(ap.worldX, apMountHeight, ap.worldZ);
        this.group.add(domeMesh);

        // 3. Subtle RF Latitude Wireframe Rings
        const wireMat = new THREE.LineBasicMaterial({
          color: apColor,
          transparent: true,
          opacity: 0.28,
          depthWrite: false
        });
        const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
        wireMesh.position.set(ap.worldX, apMountHeight, ap.worldZ);
        this.group.add(wireMesh);

        this.waveMeshes.push({
          ringMesh,
          domeMesh,
          wireMesh,
          ap,
          initialRadius: 0.4,
          currentRadius: 0.4 + i * 4.2,
          maxRadius: 13.5, // Signal propagation visual radius
          speed: 3.2, // meters per second
          ringMaterial: ringMat,
          domeMaterial: domeMat,
          wireMaterial: wireMat
        });
      }
    }
  }

  public animate(deltaTime: number, visible: boolean): void {
    this.group.visible = visible;
    if (!visible) return;

    for (const item of this.waveMeshes) {
      item.currentRadius += item.speed * deltaTime;
      if (item.currentRadius > item.maxRadius) {
        item.currentRadius = item.initialRadius;
      }

      const r = Math.max(0.1, item.currentRadius);

      // Scale ground ring horizontally
      item.ringMesh.scale.set(r, 1, r);

      // Scale 3D hemispherical dome in 3D
      // Slightly flatter in Y to match indoor ceiling-to-floor wave lobe
      const domeScaleY = Math.min(r, 2.6);
      item.domeMesh.scale.set(r, domeScaleY, r);
      item.wireMesh.scale.set(r, domeScaleY, r);

      // Fade out as it expands outward
      const progress = (item.currentRadius - item.initialRadius) / (item.maxRadius - item.initialRadius);
      const alpha = Math.sin((1 - progress) * Math.PI * 0.5);

      item.ringMaterial.opacity = Math.max(0, alpha * 0.65);
      item.domeMaterial.opacity = Math.max(0, alpha * 0.16);
      item.wireMaterial.opacity = Math.max(0, alpha * 0.32);
    }
  }

  public dispose(): void {
    while (this.group.children.length > 0) {
      const child = this.group.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
      this.group.remove(child);
    }
  }
}

