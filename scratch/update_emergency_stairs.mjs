import fs from 'fs';

let content = fs.readFileSync('src/data/floorplanData.ts', 'utf8');

// 1. Add enclosing walls for Emergency Stair (stairs-right-bot, x: 1113..1252, y: 556..616)
// North wall: (1113, 556) -> (1252, 556)
// South wall: (1113, 616) -> (1252, 616)
// West wall: (1113, 556) -> (1113, 616) with door gap
// East wall: (1252, 556) -> (1252, 616) separating from R. Kelas 70.47m2

const newEmergencyWalls = `  {
    "id": "wall-emrg-st-n",
    "x1": 1113,
    "y1": 556,
    "x2": 1252,
    "y2": 556,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-emrg-st-s",
    "x1": 1113,
    "y1": 616,
    "x2": 1252,
    "y2": 616,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-emrg-st-w1",
    "x1": 1113,
    "y1": 556,
    "x2": 1113,
    "y2": 570,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-emrg-st-w2",
    "x1": 1113,
    "y1": 590,
    "x2": 1113,
    "y2": 616,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 6,
    "color": "#081d58"
  },
  {
    "id": "wall-emrg-st-e",
    "x1": 1252,
    "y1": 556,
    "x2": 1252,
    "y2": 696,
    "thickness": 0.3,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 7,
    "color": "#081d58"
  },`;

// Insert new walls into WALL_SEGMENTS before the closing ];
content = content.replace(/(  \{\s*"id":\s*"wall-st-bc-v3"[\s\S]*?\n  \}\n)(];)/, `$1,\n${newEmergencyWalls}\n$2`);
console.log('Inserted emergency stair enclosing walls into WALL_SEGMENTS');

// 2. Add door-emrg-st-bot into DOOR_ITEMS
const emergencyDoor = `  {
    "id": "door-emrg-st-bot",
    "name": "Pintu Tangga Darurat Bawah",
    "x": 1113,
    "y": 580,
    "width": 1.0,
    "type": "single",
    "orientation": "vertical",
    "swingDirection": 1
  },`;

content = content.replace(/(export const DOOR_ITEMS: DoorInfo\[\] = \[\n)/, `$1${emergencyDoor}\n`);
console.log('Inserted door-emrg-st-bot into DOOR_ITEMS');

// 3. Add room zone for stairs-emergency-bot
const emergencyZone = `  {
    "id": "stairs-emergency-bot",
    "name": "Tangga Darurat",
    "wing": "east",
    "level": "+12.00",
    "x": 1113,
    "y": 556,
    "width": 139,
    "height": 60,
    "floorType": "concrete"
  },`;

content = content.replace(/(  \{\s*"id":\s*"rk-e6"[\s\S]*?\n  \},)/, `$1\n${emergencyZone}`);
console.log('Inserted stairs-emergency-bot into ROOM_ZONES');

// 4. Update stairs-right-bot in FACILITY_FIXTURES to reflect exact dimensions within enclosure
content = content.replace(/\{\s*"id":\s*"stairs-right-bot"[\s\S]*?\}/,
`{
    "id": "stairs-right-bot",
    "name": "Tangga Darurat (Tertutup Tembok)",
    "type": "stairs",
    "x": 1182,
    "y": 586,
    "width": 6.8,
    "depth": 2.8,
    "rotation": 0
  }`);

fs.writeFileSync('src/data/floorplanData.ts', content);
console.log('Successfully updated floorplanData.ts with emergency stair walls, door, and room zone');
