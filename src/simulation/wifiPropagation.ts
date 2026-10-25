import type { AccessPoint, ConcretePillar, WallSegment } from '../types/floorplan';

export interface SignalSample {
  rssi: number;
  bestAP: AccessPoint | null;
  penetratedWalls: number;
  penetratedPillars: number;
  distanceMeters: number;
  snr: number; // Signal to Noise Ratio estimation (assuming -95 dBm noise floor)
}

// 2D Line-Segment Intersection Test
function checkLineIntersection(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): boolean {
  // Denominator
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (Math.abs(denom) < 1e-6) return false;

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

  return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
}

// Check intersection with pillar bounding box
function checkPillarIntersection(
  p1x: number, p1y: number, p2x: number, p2y: number,
  colSvgX: number, colSvgY: number, sizeSvg: number
): boolean {
  const half = sizeSvg / 2;
  const minX = colSvgX - half;
  const maxX = colSvgX + half;
  const minY = colSvgY - half;
  const maxY = colSvgY + half;

  // Test 4 sides of the pillar box
  if (checkLineIntersection(p1x, p1y, p2x, p2y, minX, minY, maxX, minY)) return true;
  if (checkLineIntersection(p1x, p1y, p2x, p2y, maxX, minY, maxX, maxY)) return true;
  if (checkLineIntersection(p1x, p1y, p2x, p2y, maxX, maxY, minX, maxY)) return true;
  if (checkLineIntersection(p1x, p1y, p2x, p2y, minX, maxY, minX, minY)) return true;
  return false;
}

/**
 * Calculate RSSI at a given world coordinate (worldX, worldZ in meters)
 * from all active Access Points.
 */
export function calculateSignalAt(
  worldX: number,
  worldZ: number,
  accessPoints: AccessPoint[],
  walls: WallSegment[],
  pillars: ConcretePillar[]
): SignalSample {
  const NOISE_FLOOR = -95;
  let maxRssi = -120;
  let bestAP: AccessPoint | null = null;
  let bestPenetratedWalls = 0;
  let bestPenetratedPillars = 0;
  let bestDist = 0;

  // Convert target to SVG coords for collision testing against walls & pillars
  const targetSvgX = worldX / 0.05 + 700;
  const targetSvgY = worldZ / 0.05 + 360;

  const activeAPs = accessPoints.filter(ap => ap.enabled);
  if (activeAPs.length === 0) {
    return {
      rssi: -100,
      bestAP: null,
      penetratedWalls: 0,
      penetratedPillars: 0,
      distanceMeters: 0,
      snr: 0
    };
  }

  for (const ap of activeAPs) {
    const dx = worldX - ap.worldX;
    const dz = worldZ - ap.worldZ;
    const dist3D = Math.max(Math.sqrt(dx * dx + dz * dz + (2.6 - 1.0) ** 2), 0.5); // AP at 2.6m ceiling, receiver at 1.0m table

    // Free Space Path Loss (FSPL) & Log-distance exponent
    const freqMhz = ap.frequencyGhz === 5.0 ? 5200 : 2400;
    // PL0: 20*log10(freq) - 27.55
    const pl0 = 20 * Math.log10(freqMhz) - 27.55;
    const pathLossExponent = 2.1;
    let pathLoss = pl0 + 10 * pathLossExponent * Math.log10(dist3D);

    // Wall Attenuation
    let wallCount = 0;
    let wallLoss = 0;
    for (const wall of walls) {
      if (checkLineIntersection(ap.x, ap.y, targetSvgX, targetSvgY, wall.x1, wall.y1, wall.x2, wall.y2)) {
        wallCount++;
        wallLoss += wall.attenuationDB;
      }
    }

    // Concrete Pillar Attenuation
    let pillarCount = 0;
    let pillarLoss = 0;
    for (const pillar of pillars) {
      const sizeSvg = pillar.type === 'col-sm' ? 18 : 22;
      if (checkPillarIntersection(ap.x, ap.y, targetSvgX, targetSvgY, pillar.x, pillar.y, sizeSvg)) {
        pillarCount++;
        pillarLoss += pillar.attenuationDB;
      }
    }

    const rssi = ap.txPowerDbm - (pathLoss + wallLoss + pillarLoss);

    if (rssi > maxRssi) {
      maxRssi = rssi;
      bestAP = ap;
      bestPenetratedWalls = wallCount;
      bestPenetratedPillars = pillarCount;
      bestDist = dist3D;
    }
  }

  const boundedRssi = Math.max(Math.min(maxRssi, -20), -100);

  return {
    rssi: Number(boundedRssi.toFixed(1)),
    bestAP,
    penetratedWalls: bestPenetratedWalls,
    penetratedPillars: bestPenetratedPillars,
    distanceMeters: Number(bestDist.toFixed(1)),
    snr: Number(Math.max(0, boundedRssi - NOISE_FLOOR).toFixed(1))
  };
}

/**
 * Map RSSI (dBm) to RGBA color for heatmap
 * -30 dBm: Excellent (Cyan/Violet)
 * -50 dBm: Very Good (Emerald Green)
 * -65 dBm: Good (Lime Yellow)
 * -75 dBm: Fair (Amber Orange)
 * -85 dBm: Weak (Red/Crimson)
 * < -90 dBm: Transparent / Dead zone
 */
export function rssiToColor(rssi: number, alphaMultiplier = 1.0): [number, number, number, number] {
  if (rssi <= -95) {
    return [0, 0, 0, 0];
  }

  // Normalized value from 0 (dead, -90 dBm) to 1 (excellent, -30 dBm)
  const norm = Math.max(0, Math.min((rssi - (-90)) / 60, 1));

  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0.75 * alphaMultiplier;

  if (norm < 0.2) {
    // -90 to -78 dBm: Deep Red / Magenta fade
    const t = norm / 0.2;
    r = Math.floor(180 * t + 50);
    g = 0;
    b = Math.floor(60 * (1 - t));
    a = (0.2 + 0.5 * t) * alphaMultiplier;
  } else if (norm < 0.4) {
    // -78 to -66 dBm: Red to Orange
    const t = (norm - 0.2) / 0.2;
    r = 255;
    g = Math.floor(140 * t);
    b = 0;
  } else if (norm < 0.65) {
    // -66 to -51 dBm: Orange to Yellow / Lime
    const t = (norm - 0.4) / 0.25;
    r = Math.floor(255 * (1 - t * 0.7));
    g = Math.floor(140 + 115 * t);
    b = Math.floor(30 * t);
  } else if (norm < 0.85) {
    // -51 to -39 dBm: Lime to Bright Green
    const t = (norm - 0.65) / 0.2;
    r = Math.floor(75 * (1 - t));
    g = 255;
    b = Math.floor(120 * t);
  } else {
    // -39 to -30 dBm: Emerald to Vibrant Cyan
    const t = (norm - 0.85) / 0.15;
    r = 0;
    g = Math.floor(255 - 35 * t);
    b = Math.floor(120 + 135 * t);
    a = 0.85 * alphaMultiplier;
  }

  return [r, g, b, Math.floor(a * 255)];
}

export function getSignalQuality(rssi: number): {
  label: string;
  badgeColor: string;
  bars: number;
} {
  if (rssi >= -50) return { label: 'Sangat Baik (Sangat Kuat)', badgeColor: '#00e5ff', bars: 4 };
  if (rssi >= -65) return { label: 'Baik (Stabil & Cepat)', badgeColor: '#39ff14', bars: 3 };
  if (rssi >= -75) return { label: 'Cukup (Browsing Standar)', badgeColor: '#ffd000', bars: 2 };
  if (rssi >= -85) return { label: 'Lemah (Berpotensi Putus)', badgeColor: '#ff6600', bars: 1 };
  return { label: 'Zona Mati (Tidak Ada Sinyal)', badgeColor: '#ff0055', bars: 0 };
}
