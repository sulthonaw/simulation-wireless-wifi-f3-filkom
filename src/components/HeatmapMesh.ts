import * as THREE from 'three';
import type { AccessPoint, ConcretePillar, WallSegment } from '../types/floorplan';
import { calculateSignalAt, rssiToColor } from '../simulation/wifiPropagation';

export class HeatmapManager {
  private mesh: THREE.Mesh;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;
  private material: THREE.MeshBasicMaterial;

  // Grid computation resolution
  private gridCols = 140; // 0.5 meter steps across 70m
  private gridRows = 72;  // 0.5 meter steps across 36m

  // Render canvas resolution (upscaled for smooth visual blending)
  private canvasWidth = 560;
  private canvasHeight = 288;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  private isCalculating = false;
  private pendingUpdate = false;

  constructor(worldWidth: number, worldDepth: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;
    this.ctx = this.canvas.getContext('2d')!;

    // Enable smooth bicubic image smoothing
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.gridCols;
    this.offscreenCanvas.height = this.gridRows;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.generateMipmaps = false;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const geometry = new THREE.PlaneGeometry(worldWidth, worldDepth);
    geometry.rotateX(-Math.PI / 2); // Lay flat on floor

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.set(0, 0.08, 0); // Hover 8cm above floor to avoid z-fighting
    this.mesh.name = 'HeatmapMesh';
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public setOpacity(val: number): void {
    this.material.opacity = val;
  }

  public setVisible(val: boolean): void {
    this.mesh.visible = val;
  }

  /**
   * Recalculate heatmap based on active APs, walls, and pillars
   */
  public generateHeatmap(
    accessPoints: AccessPoint[],
    walls: WallSegment[],
    pillars: ConcretePillar[],
    worldWidth: number,
    worldDepth: number,
    alphaMultiplier = 1.0
  ): void {
    if (this.isCalculating) {
      this.pendingUpdate = true;
      return;
    }

    this.isCalculating = true;

    // Use requestAnimationFrame / timeout to keep UI snappy
    setTimeout(() => {
      const imgData = this.offscreenCtx.createImageData(this.gridCols, this.gridRows);
      const data = imgData.data;

      const halfW = worldWidth / 2;
      const halfD = worldDepth / 2;

      for (let gy = 0; gy < this.gridRows; gy++) {
        const worldZ = (gy / (this.gridRows - 1)) * worldDepth - halfD;
        for (let gx = 0; gx < this.gridCols; gx++) {
          const worldX = (gx / (this.gridCols - 1)) * worldWidth - halfW;

          const sample = calculateSignalAt(worldX, worldZ, accessPoints, walls, pillars);
          const [r, g, b, a] = rssiToColor(sample.rssi, alphaMultiplier);

          const idx = (gy * this.gridCols + gx) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = a;
        }
      }

      this.offscreenCtx.putImageData(imgData, 0, 0);

      // Draw upscaled onto display canvas with bicubic blur
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.ctx.drawImage(
        this.offscreenCanvas,
        0, 0, this.gridCols, this.gridRows,
        0, 0, this.canvasWidth, this.canvasHeight
      );

      // Clear out the stairwell opening so heatmap doesn't mask the descending stairs
      const cx1 = ((-0.65 + halfW) / worldWidth) * this.canvasWidth;
      const cx2 = ((4.70 + halfW) / worldWidth) * this.canvasWidth;
      const cy1 = ((6.35 + halfD) / worldDepth) * this.canvasHeight;
      const cy2 = ((10.35 + halfD) / worldDepth) * this.canvasHeight;
      this.ctx.clearRect(cx1, cy1, cx2 - cx1, cy2 - cy1);

      this.texture.needsUpdate = true;
      this.isCalculating = false;

      if (this.pendingUpdate) {
        this.pendingUpdate = false;
        this.generateHeatmap(accessPoints, walls, pillars, worldWidth, worldDepth, alphaMultiplier);
      }
    }, 10);
  }

  public dispose(): void {
    if (this.mesh.geometry) this.mesh.geometry.dispose();
    if (this.texture) this.texture.dispose();
    if (this.material) this.material.dispose();
  }
}
