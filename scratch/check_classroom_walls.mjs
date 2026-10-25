import fs from 'fs';

const content = fs.readFileSync('src/data/floorplanData.ts', 'utf8');

// match all wall segments
const regex = /\{\s*"id":\s*"([^"]+)",\s*"x1":\s*([0-9.]+),\s*"y1":\s*([0-9.]+),\s*"x2":\s*([0-9.]+),\s*"y2":\s*([0-9.]+)[^}]*\}/g;
let m;
const walls = [];
while ((m = regex.exec(content)) !== null) {
  const [_, id, x1, y1, x2, y2] = m;
  if (id.startsWith('wall-st-tc') || id.startsWith('wall-st-bc') || id.startsWith('wall-st-left') || id.startsWith('wall-toilet')) {
    walls.push({ id, x1: +x1, y1: +y1, x2: +x2, y2: +y2 });
  }
}

console.log('Classroom & service core walls:');
console.log(JSON.stringify(walls, null, 2));
