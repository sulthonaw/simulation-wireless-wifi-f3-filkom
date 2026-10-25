import fs from 'fs';

const content = fs.readFileSync('src/data/floorplanData.ts', 'utf8');

const regex = /\{\s*"id":\s*"([^"]+)",\s*"x1":\s*([0-9.]+),\s*"y1":\s*([0-9.]+),\s*"x2":\s*([0-9.]+),\s*"y2":\s*([0-9.]+)[^}]*\}/g;
let m;
const walls = [];
while ((m = regex.exec(content)) !== null) {
  const [_, id, x1, y1, x2, y2] = m;
  const minX = Math.min(+x1, +x2);
  const maxX = Math.max(+x1, +x2);
  const minY = Math.min(+y1, +y2);
  const maxY = Math.max(+y1, +y2);
  if (maxX >= 1100 && minX <= 1350 && maxY >= 500 && minY <= 720) {
    walls.push({ id, x1: +x1, y1: +y1, x2: +x2, y2: +y2 });
  }
}
console.log('Walls around emergency stair (x:1100..1350, y:500..720):');
console.log(JSON.stringify(walls, null, 2));
