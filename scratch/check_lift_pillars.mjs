import fs from 'fs';

const content = fs.readFileSync('src/data/floorplanData.ts', 'utf8');

// find CONCRETE_PILLARS
const m = content.match(/export const CONCRETE_PILLARS: ConcretePillar\[\] = (\[[\s\S]*?\]);/);
if (m) {
  const pillars = JSON.parse(m[1]);
  const nearLift = pillars.filter(p => 
    (p.x >= 670 && p.x <= 810) && (p.y >= 200 && p.y <= 500)
  );
  console.log('Pillars near lift:', JSON.stringify(nearLift, null, 2));
} else {
  console.log('No pillars found');
}
