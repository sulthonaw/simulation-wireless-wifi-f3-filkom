import fs from 'fs';

let content = fs.readFileSync('src/data/floorplanData.ts', 'utf8');

// 1. Update ROOM_ZONES for toilet-pa and toilet-pi:
// name, level, areaM2, floorType
const paZoneRegex = /\{\s*"id":\s*"toilet-pa"[\s\S]*?\},\s*\{\s*"id":\s*"toilet-pi"[\s\S]*?\}/;
const newToiletZones = `{
    "id": "toilet-pa",
    "name": "Toilet Pa (Pria)",
    "wing": "east",
    "level": "+12.00",
    "areaM2": 9.86,
    "x": 688,
    "y": 140,
    "width": 105,
    "height": 45,
    "floorType": "tiles-bright"
  },
  {
    "id": "toilet-pi",
    "name": "Toilet Pi (Wanita)",
    "wing": "east",
    "level": "+12.00",
    "areaM2": 9.19,
    "x": 688,
    "y": 185,
    "width": 102,
    "height": 38,
    "floorType": "tiles-bright"
  }`;

if (paZoneRegex.test(content)) {
  content = content.replace(paZoneRegex, newToiletZones);
  console.log('Updated toilet room zones to tiles-bright and accurate naming');
} else {
  console.log('Toilet zones regex match failed');
}

// 2. Update DOOR_ITEMS: ensure toilet doors are present with exact coordinates
// door-toilet-pa: x=793, y=172, width: 0.95
// door-toilet-pi: x=790, y=212, width: 0.95
const doorPaRegex = /\{\s*"id":\s*"door-toilet-pa"[\s\S]*?\},\s*\{\s*"id":\s*"door-toilet-pi"[\s\S]*?\}/;
const newToiletDoors = `{
    "id": "door-toilet-pa",
    "name": "Pintu Toilet Pa (Pria)",
    "x": 793,
    "y": 172,
    "width": 0.95,
    "type": "single",
    "orientation": "vertical",
    "swingDirection": -1
  },
  {
    "id": "door-toilet-pi",
    "name": "Pintu Toilet Pi (Wanita)",
    "x": 790,
    "y": 212,
    "width": 0.95,
    "type": "single",
    "orientation": "vertical",
    "swingDirection": -1
  }`;

if (doorPaRegex.test(content)) {
  content = content.replace(doorPaRegex, newToiletDoors);
  console.log('Updated toilet entrance doors in DOOR_ITEMS');
} else {
  console.log('Toilet doors regex match failed');
}

// 3. Update FACILITY_FIXTURES: Complete list for Toilet Pa (3 urinals with dividers, 2 cubicles, 1 sink) and Toilet Pi (3 cubicles with doors, 1 double sink vanity)
const toiletFixturesRegex = /\{\s*"id":\s*"stall-pi-1"[\s\S]*?\{\s*"id":\s*"sink-pa"[\s\S]*?\},\n/;
const newToiletFixtures = `  // --- Toilet Pi (Wanita) Fixtures ---
  {
    "id": "stall-pi-1",
    "name": "Bilik Toilet Pi 1",
    "type": "toilet-stall",
    "x": 703,
    "y": 196,
    "width": 1.3,
    "depth": 1.4,
    "facing": "south"
  },
  {
    "id": "stall-pi-2",
    "name": "Bilik Toilet Pi 2",
    "type": "toilet-stall",
    "x": 718,
    "y": 196,
    "width": 1.3,
    "depth": 1.4,
    "facing": "south"
  },
  {
    "id": "stall-pi-3",
    "name": "Bilik Toilet Pi 3",
    "type": "toilet-stall",
    "x": 733,
    "y": 196,
    "width": 1.3,
    "depth": 1.4,
    "facing": "south"
  },
  {
    "id": "sink-pi",
    "name": "Meja Wastafel Ganda Toilet Pi",
    "type": "sink",
    "x": 765,
    "y": 192,
    "width": 2.4,
    "depth": 0.65,
    "facing": "south"
  },
  // --- Toilet Pa (Pria) Fixtures ---
  {
    "id": "urinal-pa-1",
    "name": "Urinoir Pa 1",
    "type": "urinal",
    "x": 705,
    "y": 145,
    "width": 0.6,
    "depth": 0.45,
    "facing": "south"
  },
  {
    "id": "urinal-pa-2",
    "name": "Urinoir Pa 2",
    "type": "urinal",
    "x": 717,
    "y": 145,
    "width": 0.6,
    "depth": 0.45,
    "facing": "south"
  },
  {
    "id": "urinal-pa-3",
    "name": "Urinoir Pa 3",
    "type": "urinal",
    "x": 729,
    "y": 145,
    "width": 0.6,
    "depth": 0.45,
    "facing": "south"
  },
  {
    "id": "stall-pa-1",
    "name": "Bilik Toilet Pa 1",
    "type": "toilet-stall",
    "x": 747,
    "y": 153,
    "width": 1.25,
    "depth": 1.4,
    "facing": "south"
  },
  {
    "id": "sink-pa",
    "name": "Wastafel Toilet Pa",
    "type": "sink",
    "x": 763,
    "y": 147,
    "width": 1.2,
    "depth": 0.6,
    "facing": "south"
  },
  {
    "id": "stall-pa-2",
    "name": "Bilik Toilet Pa 2",
    "type": "toilet-stall",
    "x": 779,
    "y": 153,
    "width": 1.25,
    "depth": 1.4,
    "facing": "south"
  },\n`;

if (toiletFixturesRegex.test(content)) {
  content = content.replace(toiletFixturesRegex, newToiletFixtures);
  console.log('Updated FACILITY_FIXTURES for Toilet Pa & Pi');
} else {
  console.log('Toilet fixtures regex match failed');
}

fs.writeFileSync('src/data/floorplanData.ts', content);
console.log('Finished updating floorplanData.ts');
