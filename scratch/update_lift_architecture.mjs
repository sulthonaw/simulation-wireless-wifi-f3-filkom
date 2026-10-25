import fs from 'fs';

let content = fs.readFileSync('src/data/floorplanData.ts', 'utf8');

// 1. Update WALL_SEGMENTS: Replace wall-lift-up-s and wall-lift-dn-n with the chamfered notch walls
// Find wall-lift-up-s
const upSWallRegex = /\{\s*"id":\s*"wall-lift-up-s"[\s\S]*?\},\n/;
const dnNWallRegex = /\{\s*"id":\s*"wall-lift-dn-n"[\s\S]*?\},\n/;

const newUpSWalls = `  {
    "id": "wall-lift-up-s-1",
    "x1": 688,
    "y1": 295,
    "x2": 700,
    "y2": 295,
    "thickness": 0.3,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-lift-up-s-2",
    "x1": 700,
    "y1": 295,
    "x2": 707,
    "y2": 287,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-lift-up-s-3",
    "x1": 727,
    "y1": 287,
    "x2": 734,
    "y2": 295,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-lift-up-s-4",
    "x1": 734,
    "y1": 295,
    "x2": 750,
    "y2": 295,
    "thickness": 0.3,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-lift-up-s-5",
    "x1": 750,
    "y1": 295,
    "x2": 757,
    "y2": 287,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-lift-up-s-6",
    "x1": 777,
    "y1": 287,
    "x2": 784,
    "y2": 295,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-lift-up-s-7",
    "x1": 784,
    "y1": 295,
    "x2": 793,
    "y2": 295,
    "thickness": 0.3,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },\n`;

const newDnNWalls = `  {
    "id": "wall-lift-dn-n-1",
    "x1": 688,
    "y1": 420,
    "x2": 700,
    "y2": 420,
    "thickness": 0.3,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-lift-dn-n-2",
    "x1": 700,
    "y1": 420,
    "x2": 707,
    "y2": 428,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-lift-dn-n-3",
    "x1": 727,
    "y1": 428,
    "x2": 734,
    "y2": 420,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-lift-dn-n-4",
    "x1": 734,
    "y1": 420,
    "x2": 750,
    "y2": 420,
    "thickness": 0.3,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-lift-dn-n-5",
    "x1": 750,
    "y1": 420,
    "x2": 757,
    "y2": 428,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-lift-dn-n-6",
    "x1": 777,
    "y1": 428,
    "x2": 784,
    "y2": 420,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-lift-dn-n-7",
    "x1": 784,
    "y1": 420,
    "x2": 793,
    "y2": 420,
    "thickness": 0.3,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },\n`;

if (upSWallRegex.test(content)) {
  content = content.replace(upSWallRegex, newUpSWalls);
  console.log('Replaced wall-lift-up-s with chamfered notch walls');
} else {
  console.log('wall-lift-up-s not found');
}

if (dnNWallRegex.test(content)) {
  content = content.replace(dnNWallRegex, newDnNWalls);
  console.log('Replaced wall-lift-dn-n with chamfered notch walls');
} else {
  console.log('wall-lift-dn-n not found');
}

// 2. Update ROOM_ZONES: Rename lift zones to "LIFT"
content = content.replace(/"name":\s*"Area Lift Penumpang \(Atas\)"/g, '"name": "LIFT"');
content = content.replace(/"name":\s*"Area Lift Penumpang \(Bawah\)"/g, '"name": "LIFT"');

// 3. Update FACILITY_FIXTURES for lifts: Include facing
content = content.replace(/\{\s*"id":\s*"lift-up-1"[\s\S]*?\},\s*\{\s*"id":\s*"lift-up-2"[\s\S]*?\},\s*\{\s*"id":\s*"lift-dn-1"[\s\S]*?\},\s*\{\s*"id":\s*"lift-dn-2"[\s\S]*?\}/, 
`{
    "id": "lift-up-1",
    "name": "Lift 1 (Atas Kiri)",
    "type": "elevator",
    "x": 717,
    "y": 256,
    "width": 3.4,
    "depth": 3.2,
    "facing": "south"
  },
  {
    "id": "lift-up-2",
    "name": "Lift 2 (Atas Kanan)",
    "type": "elevator",
    "x": 767,
    "y": 256,
    "width": 3.4,
    "depth": 3.2,
    "facing": "south"
  },
  {
    "id": "lift-dn-1",
    "name": "Lift 3 (Bawah Kiri)",
    "type": "elevator",
    "x": 717,
    "y": 456,
    "width": 3.4,
    "depth": 3.2,
    "facing": "north"
  },
  {
    "id": "lift-dn-2",
    "name": "Lift 4 (Bawah Kanan)",
    "type": "elevator",
    "x": 767,
    "y": 456,
    "width": 3.4,
    "depth": 3.2,
    "facing": "north"
  }`);

fs.writeFileSync('src/data/floorplanData.ts', content);
console.log('Successfully updated src/data/floorplanData.ts');
