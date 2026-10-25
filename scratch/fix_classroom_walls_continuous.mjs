import fs from 'fs';

let content = fs.readFileSync('src/data/floorplanData.ts', 'utf8');

// 1. Update Top Classroom Walls to y=140 and remove the duplicate/misaligned wall-st-tc-s1
// Old wall-st-tc-s1 to wall-st-tc-s5 and vertical walls
const topWallsRegex = /\{\s*"id":\s*"wall-st-tc-s1"[\s\S]*?\{\s*"id":\s*"wall-st-tc-v3"[\s\S]*?\},\n/;

const newTopWalls = `  {
    "id": "wall-st-tc-s2",
    "x1": 835,
    "y1": 140,
    "x2": 905,
    "y2": 140,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 4.5,
    "color": "#42b6f5"
  },
  {
    "id": "wall-st-tc-s3",
    "x1": 905,
    "y1": 140,
    "x2": 990,
    "y2": 140,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 4.5,
    "color": "#42b6f5"
  },
  {
    "id": "wall-st-tc-s4",
    "x1": 1030,
    "y1": 140,
    "x2": 1115,
    "y2": 140,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 4.5,
    "color": "#42b6f5"
  },
  {
    "id": "wall-st-tc-s5",
    "x1": 1285,
    "y1": 140,
    "x2": 1388,
    "y2": 140,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 4.5,
    "color": "#42b6f5"
  },
  {
    "id": "wall-st-tc-v1",
    "x1": 905,
    "y1": 18,
    "x2": 905,
    "y2": 140,
    "thickness": 0.25,
    "height": 2.8,
    "type": "partition",
    "attenuationDB": 4.5,
    "color": "#2c5aa0"
  },
  {
    "id": "wall-st-tc-v2",
    "x1": 1115,
    "y1": 18,
    "x2": 1115,
    "y2": 140,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 4.5,
    "color": "#2c5aa0"
  },
  {
    "id": "wall-st-tc-v3",
    "x1": 1285,
    "y1": 18,
    "x2": 1285,
    "y2": 140,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 4.5,
    "color": "#42b6f5"
  },\n`;

if (topWallsRegex.test(content)) {
  content = content.replace(topWallsRegex, newTopWalls);
  console.log('Replaced top classroom walls with continuous y=140 walls');
} else {
  console.log('Top walls regex failed');
}

// 2. Update Bottom Classroom Walls to y=566
const botWallsRegex = /\{\s*"id":\s*"wall-st-bc-n1"[\s\S]*?\{\s*"id":\s*"wall-st-bc-v3"[\s\S]*?\},\n/;

const newBotWalls = `  {
    "id": "wall-st-bc-n2",
    "x1": 835,
    "y1": 566,
    "x2": 905,
    "y2": 566,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 4.5,
    "color": "#42b6f5"
  },
  {
    "id": "wall-st-bc-n3",
    "x1": 905,
    "y1": 566,
    "x2": 990,
    "y2": 566,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 4.5,
    "color": "#42b6f5"
  },
  {
    "id": "wall-st-bc-n4",
    "x1": 1030,
    "y1": 566,
    "x2": 1113,
    "y2": 566,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 4.5,
    "color": "#42b6f5"
  },
  {
    "id": "wall-st-bc-n5",
    "x1": 1285,
    "y1": 566,
    "x2": 1388,
    "y2": 566,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 4.5,
    "color": "#42b6f5"
  },
  {
    "id": "wall-st-bc-v1",
    "x1": 905,
    "y1": 566,
    "x2": 905,
    "y2": 696,
    "thickness": 0.25,
    "height": 2.8,
    "type": "partition",
    "attenuationDB": 4.5,
    "color": "#2c5aa0"
  },
  {
    "id": "wall-st-bc-v2",
    "x1": 1113,
    "y1": 566,
    "x2": 1113,
    "y2": 696,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 4.5,
    "color": "#2c5aa0"
  },
  {
    "id": "wall-st-bc-v3",
    "x1": 1285,
    "y1": 566,
    "x2": 1285,
    "y2": 696,
    "thickness": 0.25,
    "height": 2.8,
    "type": "interior",
    "attenuationDB": 4.5,
    "color": "#42b6f5"
  },\n`;

if (botWallsRegex.test(content)) {
  content = content.replace(botWallsRegex, newBotWalls);
  console.log('Replaced bottom classroom walls with continuous y=566 walls');
} else {
  console.log('Bottom walls regex failed');
}

// 3. Update DOOR_ITEMS for door-top-1, door-top-2, door-bot-1, door-bot-2
content = content.replace(/\{\s*"id":\s*"door-top-1"[\s\S]*?\},\s*\{\s*"id":\s*"door-top-2"[\s\S]*?\},\s*\{\s*"id":\s*"door-bot-1"[\s\S]*?\},\s*\{\s*"id":\s*"door-bot-2"[\s\S]*?\}/,
`{
    "id": "door-top-1",
    "name": "Pintu R. Kelas Atas 1",
    "x": 814,
    "y": 140,
    "width": 2.0,
    "type": "double",
    "orientation": "horizontal",
    "swingDirection": 1
  },
  {
    "id": "door-top-2",
    "name": "Pintu R. Kelas Atas 2",
    "x": 1010,
    "y": 140,
    "width": 2.0,
    "type": "double",
    "orientation": "horizontal",
    "swingDirection": 1
  },
  {
    "id": "door-bot-1",
    "name": "Pintu R. Kelas Bawah 1",
    "x": 814,
    "y": 566,
    "width": 2.0,
    "type": "double",
    "orientation": "horizontal",
    "swingDirection": -1
  },
  {
    "id": "door-bot-2",
    "name": "Pintu R. Kelas Bawah 2",
    "x": 1010,
    "y": 566,
    "width": 2.0,
    "type": "double",
    "orientation": "horizontal",
    "swingDirection": -1
  }`);

// 4. Update ROOM_ZONES heights for rk-e1, rk-e2, rk-e3 (height: 122) and rk-e4, rk-e5, rk-e6 (y: 566, height: 130)
content = content.replace(/"id":\s*"rk-e1",\s*"name":\s*"R\. Kelas Atas 1",\s*"wing":\s*"east",\s*"level":\s*"\+12\.00",\s*"areaM2":\s*69\.21,\s*"x":\s*700,\s*"y":\s*18,\s*"width":\s*205,\s*"height":\s*127/,
`"id": "rk-e1",
    "name": "R. Kelas Atas 1",
    "wing": "east",
    "level": "+12.00",
    "areaM2": 69.21,
    "x": 700,
    "y": 18,
    "width": 205,
    "height": 122`);

content = content.replace(/"id":\s*"rk-e2",\s*"name":\s*"R\. Kelas Atas 2",\s*"wing":\s*"east",\s*"level":\s*"\+12\.00",\s*"areaM2":\s*77\.59,\s*"x":\s*905,\s*"y":\s*18,\s*"width":\s*210,\s*"height":\s*127/,
`"id": "rk-e2",
    "name": "R. Kelas Atas 2",
    "wing": "east",
    "level": "+12.00",
    "areaM2": 77.59,
    "x": 905,
    "y": 18,
    "width": 210,
    "height": 122`);

content = content.replace(/"id":\s*"rk-e3",\s*"name":\s*"R\. Kelas Atas Pojok",\s*"wing":\s*"east",\s*"level":\s*"\+12\.00",\s*"x":\s*1285,\s*"y":\s*18,\s*"width":\s*103,\s*"height":\s*127/,
`"id": "rk-e3",
    "name": "R. Kelas Atas Pojok",
    "wing": "east",
    "level": "+12.00",
    "x": 1285,
    "y": 18,
    "width": 103,
    "height": 122`);

fs.writeFileSync('src/data/floorplanData.ts', content);
console.log('Successfully updated floorplanData.ts for continuous classroom walls');
