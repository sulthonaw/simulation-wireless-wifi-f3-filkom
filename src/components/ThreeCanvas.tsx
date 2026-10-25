import { useEffect, useRef, type PointerEvent } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { AccessPoint, ConcretePillar, DoorInfo, FacilityFixture, RoomZone, SimulationConfig, WallSegment } from '../types/floorplan';
import { FloorPlan3D } from './FloorPlan3D';
import { HeatmapManager } from './HeatmapMesh';
import { WaveAnimationManager } from './WaveAnimation';
import { calculateSignalAt, type SignalSample } from '../simulation/wifiPropagation';
import { SVG_DIMENSIONS } from '../data/floorplanData';

interface ThreeCanvasProps {
  accessPoints: AccessPoint[];
  walls: WallSegment[];
  pillars: ConcretePillar[];
  rooms: RoomZone[];
  doors: DoorInfo[];
  fixtures: FacilityFixture[];
  config: SimulationConfig;
  onSelectAP: (apId: string | null) => void;
  onInspectSignal: (sample: SignalSample & { worldX: number; worldZ: number }) => void;
}

export const ThreeCanvas = ({
  accessPoints,
  walls,
  pillars,
  rooms,
  doors,
  fixtures,
  config,
  onSelectAP,
  onInspectSignal
}: ThreeCanvasProps) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // References to preserve Three.js objects across re-renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const floorPlan3DRef = useRef<FloorPlan3D | null>(null);
  const heatmapManagerRef = useRef<HeatmapManager | null>(null);
  const waveManagerRef = useRef<WaveAnimationManager | null>(null);

  const probeMarkerRef = useRef<THREE.Mesh | null>(null);

  // Keep ref for dynamic render loop properties
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene - Clean Architectural Studio White
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc); // Clean white studio background
    sceneRef.current = scene;

    // 2. Camera (Sims-style isometric view)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 500);
    camera.position.set(-32, 42, 44); // Classic Sims 3 isometric angle
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera going below floor
    controls.minDistance = 8;
    controls.maxDistance = 140;
    controlsRef.current = controls;

    // 5. Lighting (Clean Architectural Daylight & Soft Studio Fill)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.95);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.3);
    sunLight.position.set(35, 52, 28);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 150;
    const d = 45;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Studio Ground Shadow Receiver Plane
    const groundShadowGeo = new THREE.PlaneGeometry(220, 220);
    groundShadowGeo.rotateX(-Math.PI / 2);
    const groundShadowMat = new THREE.ShadowMaterial({ opacity: 0.12 });
    const groundShadowMesh = new THREE.Mesh(groundShadowGeo, groundShadowMat);
    groundShadowMesh.position.y = -2.52;
    groundShadowMesh.receiveShadow = true;
    scene.add(groundShadowMesh);

    // Subtle Architectural Grid Floor
    const studioGrid = new THREE.GridHelper(160, 80, 0xcbd5e1, 0xf1f5f9);
    studioGrid.position.y = -2.54;
    scene.add(studioGrid);

    // 6. Signal Probe Pin / Marker
    const probeGeo = new THREE.ConeGeometry(0.4, 1.2, 16);
    probeGeo.rotateX(Math.PI); // Point downwards
    probeGeo.translate(0, 0.6, 0);
    const probeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const probeMesh = new THREE.Mesh(probeGeo, probeMat);
    probeMesh.visible = false;
    scene.add(probeMesh);
    probeMarkerRef.current = probeMesh;

    // 7. Initialize Sub-Managers
    const floorPlan3D = new FloorPlan3D();
    scene.add(floorPlan3D.group);
    floorPlan3DRef.current = floorPlan3D;

    const heatmapManager = new HeatmapManager(SVG_DIMENSIONS.worldWidth, SVG_DIMENSIONS.worldDepth);
    scene.add(heatmapManager.getMesh());
    heatmapManagerRef.current = heatmapManager;

    const waveManager = new WaveAnimationManager();
    scene.add(waveManager.getGroup());
    waveManagerRef.current = waveManager;

    // 8. Animation & Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      controls.update();

      if (waveManagerRef.current) {
        waveManagerRef.current.animate(deltaTime, configRef.current.showWaves);
      }

      if (floorPlan3DRef.current) {
        floorPlan3DRef.current.animate(deltaTime, now * 0.001);
      }

      // Animate probe hover bounce
      if (probeMarkerRef.current && probeMarkerRef.current.visible) {
        probeMarkerRef.current.position.y = 1.0 + Math.sin(now * 0.006) * 0.25;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      floorPlan3D.dispose();
      heatmapManager.dispose();
      waveManager.dispose();
    };
  }, []);

  // Update Geometry & Layout whenever structure props change
  useEffect(() => {
    if (!floorPlan3DRef.current) return;
    const fp = floorPlan3DRef.current;

    fp.buildFloors(rooms);
    fp.buildWalls(walls, config.wallHeightPercent);
    fp.buildPillars(pillars, config.wallHeightPercent);
    fp.buildDoors(doors, config.wallHeightPercent);
    fp.buildFixtures(fixtures);
    fp.buildAccessPoints(accessPoints, config.selectedAPId);
    fp.buildRoomLabels(rooms);
  }, [walls, pillars, rooms, doors, fixtures, accessPoints, config.selectedAPId, config.wallHeightPercent]);

  // Update AP models & selections
  useEffect(() => {
    if (floorPlan3DRef.current) {
      floorPlan3DRef.current.buildAccessPoints(accessPoints, config.selectedAPId);
    }
    if (waveManagerRef.current) {
      waveManagerRef.current.updateAPs(accessPoints);
    }
  }, [accessPoints, config.selectedAPId]);

  // Update Heatmap
  useEffect(() => {
    if (heatmapManagerRef.current) {
      heatmapManagerRef.current.setVisible(config.showHeatmap);
      heatmapManagerRef.current.setOpacity(config.heatmapOpacity);
      if (config.showHeatmap) {
        heatmapManagerRef.current.generateHeatmap(
          accessPoints,
          walls,
          pillars,
          SVG_DIMENSIONS.worldWidth,
          SVG_DIMENSIONS.worldDepth
        );
      }
    }
  }, [accessPoints, walls, pillars, config.showHeatmap, config.heatmapOpacity, config.freqMhz]);

  // Update Wall Height / Cutaway
  useEffect(() => {
    if (floorPlan3DRef.current) {
      floorPlan3DRef.current.updateWallHeight(config.wallHeightPercent);
    }
  }, [config.wallHeightPercent]);

  // Update Layer Visibilities
  useEffect(() => {
    if (!floorPlan3DRef.current) return;
    floorPlan3DRef.current.wallsGroup.visible = config.showWalls;
    floorPlan3DRef.current.pillarsGroup.visible = config.showPillars;
    floorPlan3DRef.current.labelsGroup.visible = config.showLabels;
    floorPlan3DRef.current.doorsGroup.visible = config.showDoors !== false;
    floorPlan3DRef.current.fixturesGroup.visible = config.showWalls;
  }, [config.showWalls, config.showPillars, config.showLabels, config.showDoors]);

  // Update Camera View Angle / Mode Preset
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (config.viewMode === '2d-blueprint') {
      // Top down flat view
      cam.position.set(0, 58, 0.01);
      ctrl.target.set(0, 0, 0);
      ctrl.maxPolarAngle = 0.05; // lock top-down
    } else {
      ctrl.maxPolarAngle = Math.PI / 2 - 0.05;
      if (config.cameraAngle === 'iso-nw') {
        cam.position.set(-35, 42, 42);
      } else if (config.cameraAngle === 'iso-ne') {
        cam.position.set(35, 42, 42);
      } else if (config.cameraAngle === 'iso-se') {
        cam.position.set(35, 42, -42);
      } else if (config.cameraAngle === 'iso-sw') {
        cam.position.set(-35, 42, -42);
      } else if (config.cameraAngle === 'top') {
        cam.position.set(0, 55, 0.1);
      }
      ctrl.target.set(0, 0, 0);
    }
    ctrl.update();
  }, [config.viewMode, config.cameraAngle]);

  // Handle Raycasting: Click on AP to select, or Click on Floor to probe signal
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // 1. Check if an Access Point was clicked
    if (floorPlan3DRef.current) {
      const apMeshes = floorPlan3DRef.current.getInteractiveAPMeshes();
      const apHits = raycaster.intersectObjects(apMeshes, false);
      if (apHits.length > 0) {
        const apId = apHits[0].object.userData.apId;
        onSelectAP(apId);
        return;
      }
    }

    // 2. Check if Floor was clicked (Signal Inspection)
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const floorIntersection = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(groundPlane, floorIntersection);

    if (hit) {
      // Check boundaries of building
      const halfW = SVG_DIMENSIONS.worldWidth / 2;
      const halfD = SVG_DIMENSIONS.worldDepth / 2;
      if (
        floorIntersection.x >= -halfW &&
        floorIntersection.x <= halfW &&
        floorIntersection.z >= -halfD &&
        floorIntersection.z <= halfD
      ) {
        // Position probe pin
        if (probeMarkerRef.current) {
          probeMarkerRef.current.position.set(floorIntersection.x, 1.0, floorIntersection.z);
          probeMarkerRef.current.visible = true;
        }

        const sample = calculateSignalAt(
          floorIntersection.x,
          floorIntersection.z,
          accessPoints,
          walls,
          pillars
        );

        onInspectSignal({
          ...sample,
          worldX: floorIntersection.x,
          worldZ: floorIntersection.z
        });
      }
    }
  };

  return (
    <div
      ref={mountRef}
      onPointerDown={handlePointerDown}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'crosshair',
        backgroundColor: '#0b0f19'
      }}
    />
  );
};
