import * as THREE from 'three';
import type { AccessPoint, ConcretePillar, RoomZone, WallSegment, DoorInfo, FacilityFixture } from '../types/floorplan';
import { svgToWorldCoord, SVG_DIMENSIONS } from '../data/floorplanData';

export class FloorPlan3D {
  public group: THREE.Group;
  public wallsGroup: THREE.Group;
  public pillarsGroup: THREE.Group;
  public floorsGroup: THREE.Group;
  public apModelsGroup: THREE.Group;
  public labelsGroup: THREE.Group;
  public doorsGroup: THREE.Group;
  public fixturesGroup: THREE.Group;

  private wallMeshes: {
    mesh: THREE.Mesh;
    baseHeight: number;
    initialY: number;
    wall: WallSegment;
  }[] = [];

  private pillarMeshes: {
    mesh: THREE.Mesh;
    baseHeight: number;
    initialY: number;
    pillar: ConcretePillar;
  }[] = [];

  private doorObjects: {
    group: THREE.Group;
    baseHeight: number;
    door: DoorInfo;
  }[] = [];

  private apInteractiveMeshes: Map<string, THREE.Object3D> = new Map();
  private animatedAPObjects: { mesh: THREE.Object3D; type: 'ring' | 'led' | 'beacon' }[] = [];
  private apTextures: THREE.CanvasTexture[] = [];

  // Materials for Clean White Architectural Style
  private wallMaterial: THREE.MeshStandardMaterial;
  private wallExteriorMaterial: THREE.MeshStandardMaterial;
  private pillarMaterial: THREE.MeshStandardMaterial;
  private doorFrameMaterial: THREE.MeshStandardMaterial;
  private doorLeafMaterial: THREE.MeshStandardMaterial;
  private elevatorMaterial: THREE.MeshStandardMaterial;
  private porcelainMaterial: THREE.MeshStandardMaterial;
  private floorTileTexture: THREE.CanvasTexture;
  private floorWoodTexture: THREE.CanvasTexture;
  private floorConcreteTexture: THREE.CanvasTexture;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'FloorPlan3D';

    this.floorsGroup = new THREE.Group();
    this.wallsGroup = new THREE.Group();
    this.pillarsGroup = new THREE.Group();
    this.doorsGroup = new THREE.Group();
    this.fixturesGroup = new THREE.Group();
    this.apModelsGroup = new THREE.Group();
    this.labelsGroup = new THREE.Group();

    this.group.add(this.floorsGroup);
    this.group.add(this.wallsGroup);
    this.group.add(this.pillarsGroup);
    this.group.add(this.doorsGroup);
    this.group.add(this.fixturesGroup);
    this.group.add(this.apModelsGroup);
    this.group.add(this.labelsGroup);

    // Procedural Clean White Floor Textures
    this.floorTileTexture = this.createTileTexture('#ffffff', '#e2e8f0', 8);
    this.floorWoodTexture = this.createWoodTexture();
    this.floorConcreteTexture = this.createConcreteTexture();

    // Wall Materials
    this.wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    this.wallExteriorMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.45,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    // Concrete Pillars
    this.pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.75,
      metalness: 0.1
    });

    // Doors Materials
    this.doorFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4
    });

    this.doorLeafMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.35,
      metalness: 0.05
    });

    // Elevators Material (Brushed Metallic Stainless Steel)
    this.elevatorMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.75,
      roughness: 0.25
    });

    // Sanitary Porcelain Material
    this.porcelainMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.15,
      metalness: 0.05
    });
  }

  // --- Procedural Canvas Textures for Clean White Aesthetic ---
  private createTileTexture(bgColor: string, lineColor: string, divisions: number): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    const step = 256 / divisions;
    for (let i = 0; i <= divisions; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(256, i * step);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 4);
    return texture;
  }

  private createWoodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#fef9c3'; // Light blonde oak base
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#fef08a';
    for (let i = 0; i < 256; i += 32) {
      if ((i / 32) % 2 === 0) {
        ctx.fillRect(i, 0, 32, 256);
      }
    }

    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    return texture;
  }

  private createConcreteTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
    for (let i = 0; i < 1500; i++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      ctx.fillRect(rx, ry, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 2);
    return texture;
  }

  // --- Build Clean White Floor Foundation and Rooms ---
  public buildFloors(rooms: RoomZone[]): void {
    while (this.floorsGroup.children.length > 0) {
      const child = this.floorsGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      this.floorsGroup.remove(child);
    }

    // 1. Overall foundation slab with cutout hole for descending stairs cavity
    const slabShape = new THREE.Shape();
    const halfW = (SVG_DIMENSIONS.worldWidth + 2) / 2;
    const halfD = (SVG_DIMENSIONS.worldDepth + 2) / 2;
    slabShape.moveTo(-halfW, -halfD);
    slabShape.lineTo(halfW, -halfD);
    slabShape.lineTo(halfW, halfD);
    slabShape.lineTo(-halfW, halfD);
    slabShape.closePath();

    // Cutout hole for stairs-zone (world x: -0.65 to 4.70, world z: 6.35 to 10.35)
    const stairHole = new THREE.Path();
    stairHole.moveTo(-0.65, 6.35);
    stairHole.lineTo(4.70, 6.35);
    stairHole.lineTo(4.70, 10.35);
    stairHole.lineTo(-0.65, 10.35);
    stairHole.closePath();
    slabShape.holes.push(stairHole);

    const slabGeo = new THREE.ExtrudeGeometry(slabShape, {
      depth: 2.5,
      bevelEnabled: false
    });
    slabGeo.rotateX(Math.PI / 2);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.8
    });
    const slabMesh = new THREE.Mesh(slabGeo, slabMat);
    slabMesh.position.set(0, 0, 0);
    slabMesh.receiveShadow = true;
    this.floorsGroup.add(slabMesh);

    // 2. Individual Room floor plates
    for (const room of rooms) {
      if (room.id === 'stairs-zone') {
        // Skip flat floor plate so the stairwell opens down into the cavity
        continue;
      }
      const p1 = svgToWorldCoord(room.x, room.y);
      const p2 = svgToWorldCoord(room.x + room.width, room.y + room.height);

      const w = Math.abs(p2.x - p1.x);
      const d = Math.abs(p2.z - p1.z);
      const cx = (p1.x + p2.x) / 2;
      const cz = (p1.z + p2.z) / 2;

      let floorMat: THREE.MeshStandardMaterial;
      if (room.floorType === 'tiles-wood') {
        floorMat = new THREE.MeshStandardMaterial({ map: this.floorWoodTexture, roughness: 0.35 });
      } else if (room.floorType === 'concrete') {
        floorMat = new THREE.MeshStandardMaterial({ map: this.floorConcreteTexture, roughness: 0.75 });
      } else if (room.floorType === 'hall') {
        floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
      } else {
        floorMat = new THREE.MeshStandardMaterial({ map: this.floorTileTexture, roughness: 0.45 });
      }

      const planeGeo = new THREE.PlaneGeometry(w, d);
      planeGeo.rotateX(-Math.PI / 2);

      const roomMesh = new THREE.Mesh(planeGeo, floorMat);
      roomMesh.position.set(cx, 0.01, cz);
      roomMesh.receiveShadow = true;
      this.floorsGroup.add(roomMesh);
    }
  }

  // --- Build Cutaway Walls ---
  public buildWalls(walls: WallSegment[], heightPercent: number): void {
    while (this.wallsGroup.children.length > 0) {
      const child = this.wallsGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      this.wallsGroup.remove(child);
    }
    this.wallMeshes = [];

    const fullHeight = 2.8; // meters
    const currentHeight = Math.max(0.05, fullHeight * (heightPercent / 100));

    for (const wall of walls) {
      const p1 = svgToWorldCoord(wall.x1, wall.y1);
      const p2 = svgToWorldCoord(wall.x2, wall.y2);

      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      if (length < 0.08) continue;

      const angle = Math.atan2(dz, dx);
      const cx = (p1.x + p2.x) / 2;
      const cz = (p1.z + p2.z) / 2;

      const wallGeo = new THREE.BoxGeometry(length, 1.0, wall.thickness);
      wallGeo.translate(0, 0.5, 0);

      const mat = wall.type === 'exterior' ? this.wallExteriorMaterial : this.wallMaterial;
      const mesh = new THREE.Mesh(wallGeo, mat);
      mesh.position.set(cx, 0, cz);
      mesh.rotation.y = -angle;

      mesh.scale.set(1, currentHeight, 1);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Dark top coping strip for architectural edge definition
      const topCapGeo = new THREE.BoxGeometry(length + 0.02, 0.04, wall.thickness + 0.02);
      const topCapMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
      const topCapMesh = new THREE.Mesh(topCapGeo, topCapMat);
      topCapMesh.position.set(0, 1.0, 0);
      mesh.add(topCapMesh);

      this.wallsGroup.add(mesh);

      this.wallMeshes.push({
        mesh,
        baseHeight: fullHeight,
        initialY: 0,
        wall
      });
    }
  }

  // --- Build 3D Architectural Doors (Pintu 3D & Swing Arcs) ---
  public buildDoors(doors: DoorInfo[], heightPercent: number): void {
    while (this.doorsGroup.children.length > 0) {
      const child = this.doorsGroup.children[0] as THREE.Object3D;
      this.doorsGroup.remove(child);
    }
    this.doorObjects = [];

    const fullHeight = 2.4; // door height
    const currentHeight = Math.max(0.1, fullHeight * (heightPercent / 100));

    for (const door of doors) {
      const doorGroup = new THREE.Group();
      const pos = svgToWorldCoord(door.x, door.y);
      doorGroup.position.set(pos.x, 0, pos.z);

      if (door.orientation === 'vertical') {
        doorGroup.rotation.y = Math.PI / 2;
      }

      const doorW = door.width;
      const leafW = door.type === 'double' ? doorW / 2 : doorW;
      const frameThick = 0.08;

      // 1. Door Frame (Kusen Pintu)
      const postL = new THREE.Mesh(new THREE.BoxGeometry(frameThick, 1.0, 0.16), this.doorFrameMaterial);
      postL.position.set(-doorW / 2, 0.5, 0);
      postL.castShadow = true;
      doorGroup.add(postL);

      const postR = new THREE.Mesh(new THREE.BoxGeometry(frameThick, 1.0, 0.16), this.doorFrameMaterial);
      postR.position.set(doorW / 2, 0.5, 0);
      postR.castShadow = true;
      doorGroup.add(postR);

      // Top lintel
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorW, frameThick, 0.16), this.doorFrameMaterial);
      lintel.position.set(0, 1.0, 0);
      doorGroup.add(lintel);

      // 2. Door Leaves (Daun Pintu Terbuka Sedikit / Ajar ala The Sims)
      const openAngle = (Math.PI / 4) * door.swingDirection;

      if (door.type === 'double') {
        // Left Leaf
        const leafLGroup = new THREE.Group();
        leafLGroup.position.set(-doorW / 2 + frameThick / 2, 0, 0);
        const leafL = new THREE.Mesh(new THREE.BoxGeometry(leafW, 0.96, 0.04), this.doorLeafMaterial);
        leafL.position.set(leafW / 2, 0.48, 0);
        leafL.castShadow = true;
        leafLGroup.add(leafL);
        leafLGroup.rotation.y = openAngle;
        doorGroup.add(leafLGroup);

        // Right Leaf
        const leafRGroup = new THREE.Group();
        leafRGroup.position.set(doorW / 2 - frameThick / 2, 0, 0);
        const leafR = new THREE.Mesh(new THREE.BoxGeometry(leafW, 0.96, 0.04), this.doorLeafMaterial);
        leafR.position.set(-leafW / 2, 0.48, 0);
        leafR.castShadow = true;
        leafRGroup.add(leafR);
        leafRGroup.rotation.y = -openAngle;
        doorGroup.add(leafRGroup);
      } else {
        // Single Leaf
        const leafGroup = new THREE.Group();
        leafGroup.position.set(-doorW / 2 + frameThick / 2, 0, 0);
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, 0.96, 0.04), this.doorLeafMaterial);
        leaf.position.set(leafW / 2, 0.48, 0);
        leaf.castShadow = true;
        leafGroup.add(leaf);
        leafGroup.rotation.y = openAngle;
        doorGroup.add(leafGroup);
      }

      // 3. Blueprint Door Swing Arc on Floor (Garis Ayunan Pintu)
      const arcRadius = leafW;
      const arcCurve = new THREE.EllipseCurve(
        0, 0,
        arcRadius, arcRadius,
        0, Math.PI / 2,
        false, 0
      );
      const arcPoints = arcCurve.getPoints(16);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(
        arcPoints.map(p => new THREE.Vector3(p.x - doorW / 2, 0.02, p.y * door.swingDirection))
      );
      const arcMat = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.6 });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      doorGroup.add(arcLine);

      // Scale height with cutaway slider
      doorGroup.scale.set(1, currentHeight, 1);
      this.doorsGroup.add(doorGroup);

      this.doorObjects.push({
        group: doorGroup,
        baseHeight: fullHeight,
        door
      });
    }
  }

  // --- Build Kamar Mandi, Gudang, Lift & Tangga Fixtures ---
  public buildFixtures(fixtures: FacilityFixture[]): void {
    while (this.fixturesGroup.children.length > 0) {
      const child = this.fixturesGroup.children[0] as THREE.Object3D;
      this.fixturesGroup.remove(child);
    }

    for (const fix of fixtures) {
      const pos = svgToWorldCoord(fix.x, fix.y);
      const fixGroup = new THREE.Group();
      fixGroup.position.set(pos.x, 0, pos.z);
      if (fix.rotation) fixGroup.rotation.y = fix.rotation;

      if (fix.type === 'toilet-stall') {
        const stallW = fix.width;
        const stallD = fix.depth;
        const stallH = 1.6;
        const partThick = 0.035;
        const partMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.35
        });

        // Left dividing partition
        const partL = new THREE.Mesh(new THREE.BoxGeometry(partThick, stallH, stallD), partMat);
        partL.position.set(-stallW / 2, stallH / 2, 0);
        partL.castShadow = true;
        fixGroup.add(partL);

        // Right dividing partition
        const partR = new THREE.Mesh(new THREE.BoxGeometry(partThick, stallH, stallD), partMat);
        partR.position.set(stallW / 2, stallH / 2, 0);
        partR.castShadow = true;
        fixGroup.add(partR);

        // Back wall lining / modesty panel
        const partB = new THREE.Mesh(new THREE.BoxGeometry(stallW, stallH, partThick), partMat);
        partB.position.set(0, stallH / 2, -stallD / 2);
        partB.castShadow = true;
        fixGroup.add(partB);

        // Porcelain Toilet Bowl with cistern tank
        // 1. Water cistern tank
        const tankGeo = new THREE.BoxGeometry(0.38, 0.38, 0.16);
        tankGeo.translate(0, 0.65, -stallD / 2 + 0.12);
        const tankMesh = new THREE.Mesh(tankGeo, this.porcelainMaterial);
        tankMesh.castShadow = true;
        fixGroup.add(tankMesh);

        // 2. Bowl pedestal & seat
        const bowlGeo = new THREE.CylinderGeometry(0.18, 0.14, 0.42, 16);
        bowlGeo.translate(0, 0.21, -stallD / 2 + 0.38);
        const bowlMesh = new THREE.Mesh(bowlGeo, this.porcelainMaterial);
        bowlMesh.castShadow = true;
        fixGroup.add(bowlMesh);

        // 3. Toilet seat lid
        const seatGeo = new THREE.TorusGeometry(0.14, 0.03, 8, 16);
        seatGeo.rotateX(Math.PI / 2);
        seatGeo.translate(0, 0.43, -stallD / 2 + 0.38);
        const seatMesh = new THREE.Mesh(seatGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
        fixGroup.add(seatMesh);

        // Cubicle Door with hinge & knob (slightly open / ajar at front)
        const doorLeafW = stallW * 0.72;
        const doorLeafH = 1.45;
        const doorPivot = new THREE.Group();
        doorPivot.position.set(-stallW / 2 + partThick, 0, stallD / 2);

        const cubicleDoor = new THREE.Mesh(
          new THREE.BoxGeometry(doorLeafW, doorLeafH, partThick),
          partMat
        );
        cubicleDoor.position.set(doorLeafW / 2, doorLeafH / 2 + 0.1, 0);
        cubicleDoor.castShadow = true;
        doorPivot.add(cubicleDoor);

        // Door knob / indicator lock
        const knobMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.06, 8),
          new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9 })
        );
        knobMesh.rotateZ(Math.PI / 2);
        knobMesh.position.set(doorLeafW - 0.05, 0.85, 0);
        doorPivot.add(knobMesh);

        // Open ajar angle
        doorPivot.rotation.y = Math.PI * 0.18; // ~32 deg ajar
        fixGroup.add(doorPivot);

        // Blueprint floor swing arc (Quarter-circle arc matching user's blueprint)
        const arcRadius = doorLeafW;
        const arcCurve = new THREE.EllipseCurve(0, 0, arcRadius, arcRadius, 0, Math.PI / 2, false, 0);
        const arcPoints = arcCurve.getPoints(12);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(
          arcPoints.map(p => new THREE.Vector3(p.x - stallW / 2 + partThick, 0.015, stallD / 2 + p.y * 0.4))
        );
        const arcLine = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.6 }));
        fixGroup.add(arcLine);
      } else if (fix.type === 'urinal') {
        // Wall-mounted Urinal Bowl
        const urnGeo = new THREE.BoxGeometry(0.32, 0.55, 0.28);
        urnGeo.translate(0, 0.72, 0.14);
        const urnMesh = new THREE.Mesh(urnGeo, this.porcelainMaterial);
        urnMesh.castShadow = true;
        fixGroup.add(urnMesh);

        // Chrome Flush Valve & Pipe
        const pipeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8);
        pipeGeo.translate(0, 1.15, 0.05);
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.1 });
        const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
        fixGroup.add(pipeMesh);

        // Privacy Modesty Divider Screen (left partition)
        const screenGeo = new THREE.BoxGeometry(0.03, 1.2, 0.45);
        screenGeo.translate(-fix.width / 2, 0.9, 0.22);
        const screenMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
        const screenMesh = new THREE.Mesh(screenGeo, screenMat);
        screenMesh.castShadow = true;
        fixGroup.add(screenMesh);
      } else if (fix.type === 'sink') {
        const countW = fix.width;
        const countD = fix.depth;
        const countH = 0.82;

        // Vanity Countertop
        const counterMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.25 });
        const counterMesh = new THREE.Mesh(new THREE.BoxGeometry(countW, countH, countD), counterMat);
        counterMesh.position.set(0, countH / 2, 0);
        counterMesh.castShadow = true;
        fixGroup.add(counterMesh);

        // Basins: If width >= 1.8m (e.g. Toilet Pi double sink), render 2 basins; otherwise 1 basin
        const isDouble = countW >= 1.8;
        const basinOffsets = isDouble ? [-countW * 0.25, countW * 0.25] : [0];

        const faucetMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.1 });

        for (const bx of basinOffsets) {
          // Oval porcelain basin
          const basinGeo = new THREE.CylinderGeometry(0.24, 0.18, 0.08, 16);
          basinGeo.scale(1, 1, 0.8);
          basinGeo.translate(bx, countH + 0.02, 0);
          const basinMesh = new THREE.Mesh(basinGeo, this.porcelainMaterial);
          fixGroup.add(basinMesh);

          // Chrome gooseneck faucet
          const faucetGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.2, 8);
          faucetGeo.translate(bx, countH + 0.14, -countD / 2 + 0.08);
          const faucetMesh = new THREE.Mesh(faucetGeo, faucetMat);
          fixGroup.add(faucetMesh);
        }

        // Vanity Mirror mounted on the wall behind
        const mirrorGeo = new THREE.PlaneGeometry(countW * 0.92, 0.75);
        const mirrorMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          metalness: 0.95,
          roughness: 0.05
        });
        const mirrorMesh = new THREE.Mesh(mirrorGeo, mirrorMat);
        mirrorMesh.position.set(0, countH + 0.55, -countD / 2 + 0.02);
        fixGroup.add(mirrorMesh);
      } else if (fix.type === 'elevator') {
        const cabW = Math.max(2.8, fix.width);
        const cabD = Math.max(2.8, fix.depth);
        const halfW = cabW / 2;
        const halfD = cabD / 2;
        const cabH = 2.4;
        const doorZSign = fix.facing === 'north' ? -1 : 1; // -1 for Lower Lift (North to Hall), 1 for Upper Lift (South to Hall)

        // 1. Architectural Floor Graphics ('X' with inner square & threshold matching blueprint)
        const innerHalf = 0.45; // inner square half-width
        const linePositions: number[] = [
          // Outer box
          -halfW, 0.02, -halfD,   halfW, 0.02, -halfD,
           halfW, 0.02, -halfD,   halfW, 0.02,  halfD,
           halfW, 0.02,  halfD,  -halfW, 0.02,  halfD,
          -halfW, 0.02,  halfD,  -halfW, 0.02, -halfD,

          // Inner box
          -innerHalf, 0.02, -innerHalf,   innerHalf, 0.02, -innerHalf,
           innerHalf, 0.02, -innerHalf,   innerHalf, 0.02,  innerHalf,
           innerHalf, 0.02,  innerHalf,  -innerHalf, 0.02,  innerHalf,
          -innerHalf, 0.02,  innerHalf,  -innerHalf, 0.02, -innerHalf,

          // Diagonal crosses
          -halfW, 0.02, -halfD,  -innerHalf, 0.02, -innerHalf,
           halfW, 0.02, -halfD,   innerHalf, 0.02, -innerHalf,
           halfW, 0.02,  halfD,   innerHalf, 0.02,  innerHalf,
          -halfW, 0.02,  halfD,  -innerHalf, 0.02,  innerHalf,
        ];

        const crossGeo = new THREE.BufferGeometry();
        crossGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        const crossMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.85 });
        const crossLines = new THREE.LineSegments(crossGeo, crossMat);
        fixGroup.add(crossLines);

        // 2. Door Sill / Threshold (rectangular sill on floor)
        const threshGeo = new THREE.PlaneGeometry(cabW * 0.72, 0.45);
        threshGeo.rotateX(-Math.PI / 2);
        const threshMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35 });
        const threshMesh = new THREE.Mesh(threshGeo, threshMat);
        threshMesh.position.set(0, 0.015, doorZSign * (halfD + 0.25));
        fixGroup.add(threshMesh);

        // 3. 3D Elevator Cab Walls (Brushed Stainless Steel Cab - 3 walls with open front/cutaway)
        const wallThick = 0.08;
        const cabWallMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          metalness: 0.8,
          roughness: 0.25
        });

        // Left cab wall
        const cabWallL = new THREE.Mesh(new THREE.BoxGeometry(wallThick, cabH, cabD), cabWallMat);
        cabWallL.position.set(-halfW, cabH / 2, 0);
        cabWallL.castShadow = true;
        fixGroup.add(cabWallL);

        // Right cab wall
        const cabWallR = new THREE.Mesh(new THREE.BoxGeometry(wallThick, cabH, cabD), cabWallMat);
        cabWallR.position.set(halfW, cabH / 2, 0);
        cabWallR.castShadow = true;
        fixGroup.add(cabWallR);

        // Back cab wall (opposite to entrance door)
        const cabWallB = new THREE.Mesh(new THREE.BoxGeometry(cabW, cabH, wallThick), cabWallMat);
        cabWallB.position.set(0, cabH / 2, -doorZSign * halfD);
        cabWallB.castShadow = true;
        fixGroup.add(cabWallB);

        // Cab floor plate
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
        const cabFloor = new THREE.Mesh(new THREE.PlaneGeometry(cabW, cabD), floorMat);
        cabFloor.rotateX(-Math.PI / 2);
        cabFloor.position.y = 0.01;
        cabFloor.receiveShadow = true;
        fixGroup.add(cabFloor);

        // Ceiling illumination panel
        const ceilLight = new THREE.Mesh(
          new THREE.PlaneGeometry(cabW * 0.6, cabD * 0.6),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        ceilLight.rotateX(Math.PI / 2);
        ceilLight.position.set(0, cabH - 0.02, 0);
        fixGroup.add(ceilLight);

        // 4. Sliding Elevator Doors (Stainless steel two-panel doors at the front)
        const doorZ = doorZSign * (halfD + 0.15);
        const doorWidth = cabW * 0.68;
        const leafW = doorWidth / 2 - 0.015;
        const doorH = 2.15;
        const doorMat = new THREE.MeshStandardMaterial({
          color: 0xcbd5e1,
          metalness: 0.88,
          roughness: 0.2
        });

        const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(leafW, doorH, 0.05), doorMat);
        leftDoor.position.set(-leafW / 2 - 0.01, doorH / 2, doorZ);
        leftDoor.castShadow = true;
        fixGroup.add(leftDoor);

        const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(leafW, doorH, 0.05), doorMat);
        rightDoor.position.set(leafW / 2 + 0.01, doorH / 2, doorZ);
        rightDoor.castShadow = true;
        fixGroup.add(rightDoor);

        // Door frame header / transom
        const headerMesh = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 0.2, 0.25, 0.06), this.doorFrameMaterial);
        headerMesh.position.set(0, doorH + 0.12, doorZ);
        fixGroup.add(headerMesh);

        // 5. Floor Indicator Badge ("▲ 3F")
        const indCanvas = document.createElement('canvas');
        indCanvas.width = 128;
        indCanvas.height = 48;
        const ictx = indCanvas.getContext('2d')!;
        ictx.fillStyle = '#0f172a';
        ictx.fillRect(0, 0, 128, 48);
        ictx.fillStyle = '#38bdf8';
        ictx.font = 'bold 22px Arial, sans-serif';
        ictx.textAlign = 'center';
        ictx.textBaseline = 'middle';
        ictx.fillText('▲ 3F', 64, 24);
        const indTex = new THREE.CanvasTexture(indCanvas);
        const indMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), new THREE.MeshBasicMaterial({ map: indTex }));
        indMesh.position.set(0, doorH + 0.28, doorZ + doorZSign * 0.04);
        if (doorZSign < 0) indMesh.rotation.y = Math.PI;
        fixGroup.add(indMesh);
      } else if (fix.type === 'stairs') {
        if (fix.id === 'stairs-left-bot') {
          // --- Main Central Staircase (Descending into cavity, facing East following arrow) ---
          const stairW = fix.width; // 5.25m
          const stairD = fix.depth; // 3.90m
          const halfW = stairW / 2; // 2.625m
          const halfD = stairD / 2; // 1.95m
          const stairDepthMeters = 2.35; // Total depth below floor level

          // 1. Sunken Stairwell Cavity Pit Walls & Floor
          const pitMat = new THREE.MeshStandardMaterial({
            color: 0xe2e8f0,
            roughness: 0.5
          });

          // North pit wall (next to lower lift)
          const pitN = new THREE.Mesh(new THREE.BoxGeometry(stairW, stairDepthMeters + 0.2, 0.15), pitMat);
          pitN.position.set(0, -stairDepthMeters / 2, -halfD);
          fixGroup.add(pitN);

          // South pit wall (next to south classrooms)
          const pitS = new THREE.Mesh(new THREE.BoxGeometry(stairW, stairDepthMeters + 0.2, 0.15), pitMat);
          pitS.position.set(0, -stairDepthMeters / 2, halfD);
          fixGroup.add(pitS);

          // East pit wall (next to hallway)
          const pitE = new THREE.Mesh(new THREE.BoxGeometry(0.15, stairDepthMeters + 0.2, stairD), pitMat);
          pitE.position.set(halfW, -stairDepthMeters / 2, 0);
          fixGroup.add(pitE);

          // West pit wall (closing off the deep pit side of Flight 2)
          const pitW = new THREE.Mesh(new THREE.BoxGeometry(0.15, stairDepthMeters + 0.2, stairD / 2), pitMat);
          pitW.position.set(-halfW, -stairDepthMeters / 2, -halfD / 2);
          fixGroup.add(pitW);

          // Pit Floor Plate at level -2.35m
          const pitFloorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
          const pitFloor = new THREE.Mesh(new THREE.PlaneGeometry(stairW, stairD), pitFloorMat);
          pitFloor.rotateX(-Math.PI / 2);
          pitFloor.position.set(0, -stairDepthMeters, 0);
          pitFloor.receiveShadow = true;
          fixGroup.add(pitFloor);

          // 2. Stepped Treads descending DOWNWARDS to the EAST (matching User's Arrow!)
          const flightW = (stairD - 0.25) / 2; // ~1.82m
          const landingW = 1.35; // East intermediate landing width
          const runW = stairW - landingW; // ~3.90m
          const numSteps = 8;
          const stepRise = 1.15 / numSteps; // ~0.144m rise
          const stepRun = runW / numSteps; // ~0.488m run

          const treadMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
          const riserMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
          const nosingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });

          // Intermediate Landing at the EAST end (level y = -1.15m)
          const landingGeo = new THREE.BoxGeometry(landingW, 0.15, stairD - 0.2);
          const landingMesh = new THREE.Mesh(landingGeo, treadMat);
          landingMesh.position.set(halfW - landingW / 2, -1.15 - 0.075, 0);
          fixGroup.add(landingMesh);

          // Flight 1 (South Flight: starts at West x = -halfW, y = 0.0, and descends to the EAST)
          const flight1Z = halfD - flightW / 2; // South half
          for (let s = 0; s < numSteps; s++) {
            // Steps proceed from West (-halfW) towards East (+halfW)
            const stepX = -halfW + (s + 0.5) * stepRun;
            const stepY = -((s + 1) * stepRise); // Descends downwards!

            const blockH = Math.abs(stepY - (-1.15)) + 0.15;
            const stepGeo = new THREE.BoxGeometry(stepRun, blockH, flightW);
            const stepMesh = new THREE.Mesh(stepGeo, riserMat);
            stepMesh.position.set(stepX, stepY - blockH / 2 + stepRise / 2, flight1Z);
            stepMesh.castShadow = true;
            fixGroup.add(stepMesh);

            const treadGeo = new THREE.BoxGeometry(stepRun + 0.03, 0.03, flightW + 0.02);
            const treadMesh = new THREE.Mesh(treadGeo, treadMat);
            treadMesh.position.set(stepX, stepY + 0.015, flight1Z);
            treadMesh.receiveShadow = true;
            fixGroup.add(treadMesh);

            // Nosing strip on the East-facing edge
            const noseGeo = new THREE.BoxGeometry(0.04, 0.035, flightW);
            const noseMesh = new THREE.Mesh(noseGeo, nosingMat);
            noseMesh.position.set(stepX + stepRun / 2, stepY + 0.015, flight1Z);
            fixGroup.add(noseMesh);
          }

          // Flight 2 (North Flight: begins at East landing y = -1.15m, and continues descending to the WEST down to -2.3m)
          const flight2Z = -halfD + flightW / 2; // North half
          for (let s = 0; s < numSteps; s++) {
            // Steps proceed from East towards West
            const stepX = halfW - landingW - (s + 0.5) * stepRun;
            const stepY = -1.15 - ((s + 1) * stepRise); // Continues downwards to -2.3m

            const blockH = Math.abs(stepY - (-stairDepthMeters)) + 0.15;
            const stepGeo = new THREE.BoxGeometry(stepRun, blockH, flightW);
            const stepMesh = new THREE.Mesh(stepGeo, riserMat);
            stepMesh.position.set(stepX, stepY - blockH / 2 + stepRise / 2, flight2Z);
            stepMesh.castShadow = true;
            fixGroup.add(stepMesh);

            const treadGeo = new THREE.BoxGeometry(stepRun + 0.03, 0.03, flightW + 0.02);
            const treadMesh = new THREE.Mesh(treadGeo, treadMat);
            treadMesh.position.set(stepX, stepY + 0.015, flight2Z);
            treadMesh.receiveShadow = true;
            fixGroup.add(treadMesh);

            // Nosing strip on the West-facing edge
            const noseGeo = new THREE.BoxGeometry(0.04, 0.035, flightW);
            const noseMesh = new THREE.Mesh(noseGeo, nosingMat);
            noseMesh.position.set(stepX - stepRun / 2, stepY + 0.015, flight2Z);
            fixGroup.add(noseMesh);
          }

          // 3. Central Divider Parapet & Railings
          const spineGeo = new THREE.BoxGeometry(runW, 1.1, 0.12);
          const spineMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
          const spineMesh = new THREE.Mesh(spineGeo, spineMat);
          spineMesh.position.set(-halfW + runW / 2, -0.55, 0);
          fixGroup.add(spineMesh);

          // Central Handrail
          const railMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.2 });
          const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });

          const centerRail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, runW, 8), railMat);
          centerRail.rotateZ(Math.PI / 2);
          centerRail.position.set(-halfW + runW / 2, 0.15, 0);
          fixGroup.add(centerRail);

          // 4. Floor Level Safety Guardrails (at y = 0.0 to 0.9m)
          // North guardrail (along lift wall)
          const guardN = new THREE.Mesh(new THREE.BoxGeometry(stairW, 0.88, 0.05), postMat);
          guardN.position.set(0, 0.44, -halfD + 0.04);
          fixGroup.add(guardN);
          const guardNTop = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, stairW, 8), railMat);
          guardNTop.rotateZ(Math.PI / 2);
          guardNTop.position.set(0, 0.88, -halfD + 0.04);
          fixGroup.add(guardNTop);

          // East guardrail (along hallway)
          const guardE = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.88, stairD), postMat);
          guardE.position.set(halfW - 0.04, 0.44, 0);
          fixGroup.add(guardE);
          const guardETop = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, stairD, 8), railMat);
          guardETop.rotateX(Math.PI / 2);
          guardETop.position.set(halfW - 0.04, 0.88, 0);
          fixGroup.add(guardETop);

          // West guardrail (over the deep Flight 2 pit)
          const guardW = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.88, flightW + 0.1), postMat);
          guardW.position.set(-halfW + 0.04, 0.44, flight2Z);
          fixGroup.add(guardW);
          const guardWTop = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, flightW + 0.1, 8), railMat);
          guardWTop.rotateX(Math.PI / 2);
          guardWTop.position.set(-halfW + 0.04, 0.88, flight2Z);
          fixGroup.add(guardWTop);

          // 5. Direction Indicator Sign & Arrow (Matching the User's Arrow pointing East!)
          const signCanvas = document.createElement('canvas');
          signCanvas.width = 512;
          signCanvas.height = 128;
          const sctx = signCanvas.getContext('2d')!;

          sctx.fillStyle = '#0f172a';
          sctx.beginPath();
          sctx.roundRect(8, 8, 496, 112, 20);
          sctx.fill();

          sctx.strokeStyle = '#f59e0b';
          sctx.lineWidth = 4;
          sctx.stroke();

          // Glowing text and arrow
          sctx.fillStyle = '#ffffff';
          sctx.font = 'bold 36px Arial, sans-serif';
          sctx.textAlign = 'left';
          sctx.textBaseline = 'middle';
          sctx.fillText('TURUN KE LT. 2', 40, 64);

          // Prominent Golden Arrow pointing East (Right)
          sctx.fillStyle = '#f59e0b';
          sctx.beginPath();
          sctx.moveTo(380, 40);
          sctx.lineTo(440, 64);
          sctx.lineTo(380, 88);
          sctx.lineTo(380, 72);
          sctx.lineTo(330, 72);
          sctx.lineTo(330, 56);
          sctx.lineTo(380, 56);
          sctx.closePath();
          sctx.fill();

          const signTex = new THREE.CanvasTexture(signCanvas);
          const signMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(1.6, 0.45),
            new THREE.MeshBasicMaterial({ map: signTex })
          );
          signMesh.rotateX(-Math.PI / 2);
          // Position right at the West entrance of Flight 1 (pointing East)
          signMesh.position.set(-halfW + 0.9, 0.02, flight1Z);
          fixGroup.add(signMesh);

          // 6. Recessed LED Step Lights along Pit Wall
          const ledLightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
          const lightGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.04, 8);
          for (let s = 0; s < numSteps; s++) {
            const stepX = -halfW + (s + 0.5) * stepRun;
            const stepY = -((s + 1) * stepRise) + 0.12;
            const lightMesh = new THREE.Mesh(lightGeo, ledLightMat);
            lightMesh.position.set(stepX, stepY, halfD - 0.06);
            fixGroup.add(lightMesh);
          }
        } else {
          // --- Enclosed Emergency Fire Staircase (Tangga Darurat yang tertutup tembok) ---
          const emrgW = fix.width;
          const emrgD = fix.depth;
          const halfW = emrgW / 2;
          const halfD = emrgD / 2;

          // 1. Concrete floor plate inside the enclosed stairwell room
          const emrgFloorGeo = new THREE.PlaneGeometry(emrgW, emrgD);
          emrgFloorGeo.rotateX(-Math.PI / 2);
          const emrgFloorMesh = new THREE.Mesh(
            emrgFloorGeo,
            new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 })
          );
          emrgFloorMesh.position.y = 0.015;
          emrgFloorMesh.receiveShadow = true;
          fixGroup.add(emrgFloorMesh);

          // 2. Heavy-duty 2-flight fire escape stairs
          const numSteps = 8;
          const stepRise = 0.16;
          const flightD = (emrgD - 0.3) / 2;
          const runW = emrgW - 1.2;
          const stepRun = runW / numSteps;
          const stepMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5 });
          const railMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7, roughness: 0.2 });

          for (let s = 0; s < numSteps; s++) {
            const stepX = -halfW + 0.6 + (s + 0.5) * stepRun;
            const stepH = (s + 1) * stepRise;
            const stepGeo = new THREE.BoxGeometry(stepRun, stepH, flightD);
            const stepMesh = new THREE.Mesh(stepGeo, stepMat);
            stepMesh.position.set(stepX, stepH / 2, halfD - flightD / 2);
            stepMesh.castShadow = true;
            fixGroup.add(stepMesh);
          }

          const centerRail = new THREE.Mesh(new THREE.BoxGeometry(runW, 0.9, 0.08), railMat);
          centerRail.position.set(0, 0.8, 0);
          fixGroup.add(centerRail);

          // 3. Blueprint Graphic Symbol & Sign ("EXIT / NAIK")
          const linePositions: number[] = [];
          for (let s = 0; s <= numSteps; s++) {
            const lx = -halfW + 0.6 + s * stepRun;
            linePositions.push(lx, 0.02, -halfD + 0.1, lx, 0.02, halfD - 0.1);
          }
          const stairLinesGeo = new THREE.BufferGeometry();
          stairLinesGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
          const stairLines = new THREE.LineSegments(
            stairLinesGeo,
            new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.8 })
          );
          fixGroup.add(stairLines);

          const badgeCanvas = document.createElement('canvas');
          badgeCanvas.width = 128;
          badgeCanvas.height = 48;
          const bctx = badgeCanvas.getContext('2d')!;
          bctx.fillStyle = '#065f46';
          bctx.fillRect(0, 0, 128, 48);
          bctx.fillStyle = '#ffffff';
          bctx.font = 'bold 20px Arial, sans-serif';
          bctx.textAlign = 'center';
          bctx.textBaseline = 'middle';
          bctx.fillText('EXIT / NAIK', 64, 24);
          const badgeTex = new THREE.CanvasTexture(badgeCanvas);
          const badgeMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 0.3),
            new THREE.MeshBasicMaterial({ map: badgeTex })
          );
          badgeMesh.rotateX(-Math.PI / 2);
          badgeMesh.position.set(-halfW + 0.6, 0.03, 0);
          fixGroup.add(badgeMesh);
        }
      }

      this.fixturesGroup.add(fixGroup);
    }
  }

  // --- Build Concrete Pillars (Tiang Beton) ---
  public buildPillars(pillars: ConcretePillar[], heightPercent: number): void {
    while (this.pillarsGroup.children.length > 0) {
      const child = this.pillarsGroup.children[0] as THREE.Mesh;
      if (child.geometry) child.geometry.dispose();
      this.pillarsGroup.remove(child);
    }
    this.pillarMeshes = [];

    const fullHeight = 3.2; // Taller than walls
    const currentHeight = Math.max(0.1, fullHeight * (heightPercent / 100));

    for (const pillar of pillars) {
      const worldPos = svgToWorldCoord(pillar.x, pillar.y);

      // Main Column Mesh
      const pillarGeo = new THREE.BoxGeometry(pillar.width, 1.0, pillar.depth);
      pillarGeo.translate(0, 0.5, 0);

      const mesh = new THREE.Mesh(pillarGeo, this.pillarMaterial);
      mesh.position.set(worldPos.x, 0, worldPos.z);
      mesh.scale.set(1, currentHeight, 1);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Reinforced concrete cap
      const capGeo = new THREE.BoxGeometry(pillar.width + 0.08, 0.06, pillar.depth + 0.08);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.set(0, 1.0, 0);
      mesh.add(capMesh);

      this.pillarsGroup.add(mesh);

      this.pillarMeshes.push({
        mesh,
        baseHeight: fullHeight,
        initialY: 0,
        pillar
      });
    }
  }

  // --- Squircle Shape Generator for Ruckus AP ---
  private createSquircleShape(width: number, depth: number, radius: number): THREE.Shape {
    const shape = new THREE.Shape();
    const hw = width / 2;
    const hd = depth / 2;
    const r = Math.min(radius, hw - 0.01, hd - 0.01);
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
    return shape;
  }

  // --- High-Resolution Faceplate Texture with Blueprint Dial & LEDs ---
  private createAPFaceplateTexture(ap: AccessPoint): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // 1. Chassis Background (Crisp Commercial Enterprise White)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(16, 16, 480, 480, 64);
    ctx.fill();

    // 2. Aerodynamic contour groove
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(26, 26, 460, 460, 56);
    ctx.stroke();

    // 3. Top Branding Header ("RUCKUS • Wi-Fi 6")
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RUCKUS • Wi-Fi 6', 256, 70);

    // 4. Central Blueprint Node Dial (The classic blueprint AP circular marker!)
    const cx = 256;
    const cy = 252;
    const dialRadius = 126;

    // Outer subtle glow ring
    ctx.strokeStyle = ap.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, dialRadius + 14, 0, Math.PI * 2);
    ctx.stroke();

    // Radiating antenna tick notches (24 notches around perimeter)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 4;
    const numTicks = 24;
    for (let i = 0; i < numTicks; i++) {
      const angle = (i / numTicks) * Math.PI * 2;
      const r1 = dialRadius + 2;
      const r2 = dialRadius + 10;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.stroke();
    }

    // Dial core circle
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, dialRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, dialRadius - 6, 0, Math.PI * 2);
    ctx.stroke();

    // Channel Number in bold glowing typography
    ctx.fillStyle = '#ff9999';
    ctx.font = 'bold 64px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const channelDisplay = String(ap.channel || '149');
    ctx.fillText(channelDisplay, cx, cy - 8);

    // Band subtitle
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText(ap.frequencyGhz ? `${ap.frequencyGhz} GHz` : '5 GHz', cx, cy + 42);

    // 5. Bottom Status Array (6 micro-LED indicator labels)
    const ledLabels = ['PWR', '2.4G', '5G', 'AIR', 'L1', 'L2'];
    const ledColors = ap.enabled
      ? ['#10b981', '#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#10b981']
      : ['#ef4444', '#64748b', '#64748b', '#64748b', '#64748b', '#64748b'];

    const startX = 96;
    const gapX = 64;
    const ledY = 442;

    for (let i = 0; i < 6; i++) {
      const lx = startX + i * gapX;
      // Glowing dot
      ctx.fillStyle = ledColors[i];
      ctx.beginPath();
      ctx.arc(lx, ledY - 14, 7, 0, Math.PI * 2);
      ctx.fill();

      // Label text
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ledLabels[i], lx, ledY + 8);
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.apTextures.push(texture);
    return texture;
  }

  // --- Floor Projection Hotspot Decal Texture ---
  private createAPFloorHotspotTexture(ap: AccessPoint): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const cx = 256;
    const cy = 256;

    // 1. Soft radial gradient signal aura
    const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 240);
    grad.addColorStop(0, `${ap.color}66`);
    grad.addColorStop(0.5, `${ap.color}22`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 240, 0, Math.PI * 2);
    ctx.fill();

    // 2. Technical radar reticle (dashed circle)
    ctx.strokeStyle = ap.color;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. 4 Crosshair ticks
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    const rIn = 140;
    const rOut = 205;
    ctx.beginPath(); ctx.moveTo(cx, cy - rOut); ctx.lineTo(cx, cy - rIn); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy + rIn); ctx.lineTo(cx, cy + rOut); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - rOut, cy); ctx.lineTo(cx - rIn, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + rIn, cy); ctx.lineTo(cx + rOut, cy); ctx.stroke();

    // 4. Central Blueprint Node Circle
    const nodeR = 64;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * (nodeR + 1), cy + Math.sin(angle) * (nodeR + 1));
      ctx.lineTo(cx + Math.cos(angle) * (nodeR + 8), cy + Math.sin(angle) * (nodeR + 8));
      ctx.stroke();
    }

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, nodeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, nodeR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ff9999';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(ap.channel || '149'), cx, cy);

    const texture = new THREE.CanvasTexture(canvas);
    this.apTextures.push(texture);
    return texture;
  }

  // --- Build Ruckus Access Point 3D Hardware Models ---
  public buildAccessPoints(accessPoints: AccessPoint[], selectedAPId: string | null): void {
    while (this.apModelsGroup.children.length > 0) {
      const child = this.apModelsGroup.children[0] as THREE.Object3D;
      this.apModelsGroup.remove(child);
    }
    this.apInteractiveMeshes.clear();
    this.animatedAPObjects = [];

    const apMountHeight = 2.45; // Ceiling mounted enterprise height

    for (const ap of accessPoints) {
      const apGroup = new THREE.Group();
      apGroup.position.set(ap.worldX, apMountHeight, ap.worldZ);
      apGroup.name = ap.id;

      const isSelected = ap.id === selectedAPId;

      // 1. Ceiling Mounting Rig (Aluminum plate & drop stem at ceiling level ~2.72m)
      const mountBracketMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
      const bracketMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.025, 0.32), mountBracketMat);
      bracketMesh.position.set(0, 0.27, 0);
      apGroup.add(bracketMesh);

      const stemMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.2 });
      const stemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.24, 16), stemMat);
      stemMesh.position.set(0, 0.15, 0);
      apGroup.add(stemMesh);

      // Ethernet drop cable (subtle curved blue conduit entering the AP)
      const cableMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.5 });
      const cableMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8), cableMat);
      cableMesh.position.set(0.08, 0.16, 0.1);
      cableMesh.rotation.z = 0.12;
      apGroup.add(cableMesh);

      // 2. Ruckus AP Casing (Signature enterprise squircle with chamfered aerodynamic profile)
      // Upper heatsink rim
      const upperShape = this.createSquircleShape(0.70, 0.68, 0.14);
      const upperGeo = new THREE.ExtrudeGeometry(upperShape, { depth: 0.04, bevelEnabled: false });
      upperGeo.rotateX(Math.PI / 2);
      const upperMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
      const upperMesh = new THREE.Mesh(upperGeo, upperMat);
      upperMesh.position.y = 0.04;
      upperMesh.castShadow = true;
      apGroup.add(upperMesh);

      // Main lower chassis (Clean Commercial White AP)
      const mainShape = this.createSquircleShape(0.76, 0.74, 0.16);
      const mainGeo = new THREE.ExtrudeGeometry(mainShape, {
        depth: 0.09,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 3
      });
      mainGeo.rotateX(Math.PI / 2);
      const mainMat = new THREE.MeshStandardMaterial({
        color: isSelected ? 0x0284c7 : 0xffffff,
        roughness: 0.25,
        metalness: 0.08
      });
      const mainMesh = new THREE.Mesh(mainGeo, mainMat);
      mainMesh.position.y = 0.0;
      mainMesh.castShadow = true;
      apGroup.add(mainMesh);

      // 3. Bottom Faceplate (Displays Ruckus branding, 3D blueprint dial, channel & micro-LEDs)
      const faceTex = this.createAPFaceplateTexture(ap);
      const faceGeo = new THREE.PlaneGeometry(0.66, 0.64);
      const faceMat = new THREE.MeshBasicMaterial({ map: faceTex, transparent: true });
      const faceMesh = new THREE.Mesh(faceGeo, faceMat);
      faceMesh.rotateX(Math.PI / 2); // Facing downwards toward the floor
      faceMesh.position.y = -0.116;
      apGroup.add(faceMesh);

      // 4. Physical 3D Micro-LED Glow Lenses
      const ledColors = ap.enabled
        ? [0x10b981, 0x06b6d4, 0x3b82f6, 0x10b981, 0xf59e0b, 0x10b981]
        : [0xef4444, 0x475569, 0x475569, 0x475569, 0x475569, 0x475569];
      const startX = -0.18;
      const gapX = 0.072;
      const ledZ = 0.26; // Near front edge
      const ledGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12);
      for (let i = 0; i < 6; i++) {
        const ledMat = new THREE.MeshBasicMaterial({ color: ledColors[i] });
        const ledMesh = new THREE.Mesh(ledGeo, ledMat);
        ledMesh.position.set(startX + i * gapX, -0.118, ledZ);
        apGroup.add(ledMesh);
      }

      // 5. Floor Hotspot Projection Decal (Projected Blueprint Node on the Floor)
      const floorDecalTex = this.createAPFloorHotspotTexture(ap);
      const floorDecalGeo = new THREE.PlaneGeometry(2.4, 2.4);
      const floorDecalMat = new THREE.MeshBasicMaterial({
        map: floorDecalTex,
        transparent: true,
        opacity: isSelected ? 0.95 : 0.78,
        depthWrite: false
      });
      const floorDecalMesh = new THREE.Mesh(floorDecalGeo, floorDecalMat);
      floorDecalMesh.rotateX(-Math.PI / 2);
      floorDecalMesh.position.set(0, -apMountHeight + 0.018, 0); // Right on the floor
      floorDecalMesh.receiveShadow = true;
      apGroup.add(floorDecalMesh);

      // 6. Vertical Light Beam / Alignment Ray connecting AP to floor
      const beamGeo = new THREE.CylinderGeometry(0.008, 0.008, apMountHeight, 8);
      const beamMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x00f0ff : 0x94a3b8,
        transparent: true,
        opacity: isSelected ? 0.55 : 0.22,
        depthWrite: false
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.set(0, -apMountHeight / 2, 0);
      apGroup.add(beamMesh);

      // 7. Selection Animated Halo Ring
      if (isSelected) {
        const selHaloGeo = new THREE.TorusGeometry(0.58, 0.022, 16, 48);
        selHaloGeo.rotateX(Math.PI / 2);
        const selHaloMat = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          transparent: true,
          opacity: 0.85
        });
        const selHaloMesh = new THREE.Mesh(selHaloGeo, selHaloMat);
        selHaloMesh.position.y = -0.06;
        apGroup.add(selHaloMesh);
        this.animatedAPObjects.push({ mesh: selHaloMesh, type: 'ring' });
      }

      // 8. Floating Clean White 3D Badge Sprite
      const sprite = this.createAPLabelSprite(ap, isSelected);
      sprite.position.set(0, 0.78, 0);
      apGroup.add(sprite);

      // 9. Interactive Hit Target for Raycasting
      const hitGeo = new THREE.SphereGeometry(1.0, 16, 16);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.userData = { apId: ap.id, isAP: true };
      apGroup.add(hitMesh);

      this.apInteractiveMeshes.set(ap.id, hitMesh);
      this.apModelsGroup.add(apGroup);
    }
  }

  // --- Build Room Name Text Labels in 3D (Clean White Card Style) ---
  public buildRoomLabels(rooms: RoomZone[]): void {
    while (this.labelsGroup.children.length > 0) {
      const child = this.labelsGroup.children[0] as THREE.Object3D;
      this.labelsGroup.remove(child);
    }

    for (const room of rooms) {
      const p1 = svgToWorldCoord(room.x, room.y);
      const p2 = svgToWorldCoord(room.x + room.width, room.y + room.height);
      const cx = (p1.x + p2.x) / 2;
      const cz = (p1.z + p2.z) / 2;

      const labelText = room.areaM2 ? `${room.name}\n${room.level} (${room.areaM2} m²)` : `${room.name}\n${room.level}`;
      const sprite = this.createRoomBadgeSprite(labelText);
      sprite.position.set(cx, 0.15, cz);
      this.labelsGroup.add(sprite);
    }
  }

  // Clean White Canvas Sprites
  private createAPLabelSprite(ap: AccessPoint, isSelected: boolean): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 110;
    const ctx = canvas.getContext('2d')!;

    // Card background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
    ctx.strokeStyle = isSelected ? '#0284c7' : 'rgba(226, 232, 240, 0.85)';
    ctx.lineWidth = isSelected ? 4 : 2;
    ctx.beginPath();
    ctx.roundRect(8, 8, 264, 94, 16);
    ctx.fill();
    ctx.stroke();

    // Status Indicator Dot
    const statusColor = !ap.enabled ? '#ef4444' : ap.status === 'Flagged' ? '#f59e0b' : '#10b981';
    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(28, 36, 7, 0, Math.PI * 2);
    ctx.fill();

    // AP Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(ap.name, 44, 42);

    // Subtitle: Model & Client count
    ctx.fillStyle = '#64748b';
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText(`${ap.model || 'Ruckus R650'} • ${ap.clientCount} Klien`, 24, 72);

    // Channel badge in corner
    ctx.fillStyle = isSelected ? '#0284c7' : '#0284c7';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText(`Ch ${ap.channel || '149'}`, 24, 92);

    const texture = new THREE.CanvasTexture(canvas);
    this.apTextures.push(texture);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.8, 1.1, 1);
    return sprite;
  }

  private createRoomBadgeSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const lines = text.split('\n');
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 236, 108, 12);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(lines[0], 128, 48);

    if (lines[1]) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Arial, sans-serif';
      ctx.fillText(lines[1], 128, 82);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.9 });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(3.2, 1.6, 1);
    return sprite;
  }

  // --- Update Wall, Pillar & Door Cutaway Height Dynamically ---
  public updateWallHeight(heightPercent: number): void {
    const fullWallH = 2.8;
    const currentWallH = Math.max(0.05, fullWallH * (heightPercent / 100));
    for (const item of this.wallMeshes) {
      item.mesh.scale.set(1, currentWallH, 1);
    }

    const fullPillarH = 3.2;
    const currentPillarH = Math.max(0.1, fullPillarH * (heightPercent / 100));
    for (const item of this.pillarMeshes) {
      item.mesh.scale.set(1, currentPillarH, 1);
    }

    const fullDoorH = 2.4;
    const currentDoorH = Math.max(0.1, fullDoorH * (heightPercent / 100));
    for (const item of this.doorObjects) {
      item.group.scale.set(1, currentDoorH, 1);
    }
  }

  public animate(_deltaTime: number, timeSec: number): void {
    for (const obj of this.animatedAPObjects) {
      if (obj.type === 'ring') {
        obj.mesh.rotation.z = timeSec * 1.8;
      }
    }
  }

  public getInteractiveAPMeshes(): THREE.Object3D[] {
    return Array.from(this.apInteractiveMeshes.values());
  }

  public dispose(): void {
    this.wallMaterial.dispose();
    this.wallExteriorMaterial.dispose();
    this.pillarMaterial.dispose();
    this.doorFrameMaterial.dispose();
    this.doorLeafMaterial.dispose();
    this.elevatorMaterial.dispose();
    this.porcelainMaterial.dispose();
    this.floorTileTexture.dispose();
    this.floorWoodTexture.dispose();
    this.floorConcreteTexture.dispose();
    for (const tex of this.apTextures) {
      tex.dispose();
    }
    this.apTextures = [];
  }
}
