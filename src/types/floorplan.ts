export interface WallSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number; // in meters
  height: number;    // in meters
  type: 'exterior' | 'interior' | 'partition' | 'glass';
  attenuationDB: number; // dB attenuation for RF calculation
  color?: string;
}

export interface ConcretePillar {
  id: string;
  x: number;
  y: number;
  width: number;  // in meters
  depth: number;  // in meters
  height: number; // in meters
  type: 'col-sm' | 'col-lg';
  attenuationDB: number;
}

export interface AccessPoint {
  id: string;
  name: string;
  model: string;         // e.g. "Ruckus R650"
  macAddress: string;    // e.g. "C0:C7:0A:18:42:C0"
  ipAddress: string;     // e.g. "10.34.11.18"
  clientCount: number;   // active connected users
  status: 'Online' | 'Flagged' | 'Offline';
  channelLabel: string;
  channel2g?: string;
  channel5g?: string;
  x: number;             // in SVG coordinate units
  y: number;
  worldX: number;        // in 3D world meters (centered)
  worldZ: number;
  txPowerDbm: number;    // e.g. 20 dBm
  frequencyGhz: 2.4 | 5.0;
  channel: number;
  enabled: boolean;
  color: string;
}

export interface RoomZone {
  id: string;
  name: string;
  wing: 'west' | 'east' | 'transition';
  level: string; // "+11.00" or "+12.00"
  areaM2?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  floorType: 'tiles-bright' | 'tiles-wood' | 'concrete' | 'carpet' | 'hall';
}

export interface DoorInfo {
  id: string;
  name: string;
  x: number; // SVG coordinate center
  y: number;
  width: number; // in meters (e.g. 2.2m for double, 1.0m for single)
  type: 'single' | 'double';
  orientation: 'horizontal' | 'vertical';
  swingDirection: 1 | -1; // 1: up/left, -1: down/right
}

export interface FacilityFixture {
  id: string;
  name: string;
  type: 'toilet-stall' | 'elevator' | 'stairs' | 'urinal' | 'sink';
  x: number; // SVG coords
  y: number;
  width: number; // in meters
  depth: number; // in meters
  height?: number;
  rotation?: number;
  facing?: 'north' | 'south' | 'east' | 'west';
}

export interface SimulationConfig {
  freqMhz: number; // 2400 or 5200
  gridResolution: number;
  showHeatmap: boolean;
  showWaves: boolean;
  showPillars: boolean;
  showWalls: boolean;
  showLabels: boolean;
  showDoors: boolean;
  wallHeightPercent: number; // 0 (flat 2D) to 100 (full 3D)
  viewMode: '3d-sims' | '2d-blueprint' | 'first-person';
  cameraAngle: 'iso-nw' | 'iso-ne' | 'iso-se' | 'iso-sw' | 'top';
  selectedAPId: string | null;
  heatmapOpacity: number;
  colorMap: 'standard' | 'rainbow' | 'spectral' | 'turbo';
}
