import fs from 'fs';
import zlib from 'zlib';

const inputPath = 'C:/Users/sulto/.gemini/antigravity-ide/brain/e5bafe18-79cc-4b50-8e9f-c88e163b8c41/.user_uploaded/media_1792906447287.png';
const rawBuf = fs.readFileSync(inputPath);

// 1. Copy raw file
fs.writeFileSync('public/building-f3.png', rawBuf);
fs.writeFileSync('src/assets/building-f3.png', rawBuf);

// 2. Decode PNG
const width = rawBuf.readUInt32BE(16);
const height = rawBuf.readUInt32BE(20);
console.log(`Original PNG: ${width}x${height}`);

let idats = [];
let offset = 8;
while (offset < rawBuf.length) {
  const len = rawBuf.readUInt32BE(offset);
  const type = rawBuf.subarray(offset + 4, offset + 8).toString('ascii');
  if (type === 'IDAT') {
    idats.push(rawBuf.subarray(offset + 8, offset + 8 + len));
  }
  offset += 12 + len;
}

const decompressed = zlib.inflateSync(Buffer.concat(idats));
const srcPixels = new Uint8Array(width * height * 4);

const bytesPerPixel = 4;
const stride = width * bytesPerPixel;
let inOffset = 0;

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

for (let y = 0; y < height; y++) {
  const filterType = decompressed[inOffset++];
  const prevLine = y > 0 ? (y - 1) * stride : null;
  const currLine = y * stride;

  for (let x = 0; x < stride; x++) {
    const rawVal = decompressed[inOffset++];
    const bpp = bytesPerPixel;
    const a = x >= bpp ? srcPixels[currLine + x - bpp] : 0;
    const b = prevLine !== null ? srcPixels[prevLine + x] : 0;
    const c = (prevLine !== null && x >= bpp) ? srcPixels[prevLine + x - bpp] : 0;

    let val = 0;
    if (filterType === 0) val = rawVal;
    else if (filterType === 1) val = (rawVal + a) & 0xff;
    else if (filterType === 2) val = (rawVal + b) & 0xff;
    else if (filterType === 3) val = (rawVal + Math.floor((a + b) / 2)) & 0xff;
    else if (filterType === 4) val = (rawVal + paeth(a, b, c)) & 0xff;
    else val = rawVal;

    srcPixels[currLine + x] = val;
  }
}

// 3. Create target canvas: 320x320 with White Rounded Background
const targetSize = 320;
const radius = 64; // rounded corner radius
const padding = 16; // slight inset so the 3D building fits comfortably inside
const innerSize = targetSize - padding * 2; // 288x288

const outPixels = new Uint8Array(targetSize * targetSize * 4);

// Function to compute distance to rounded rectangle boundary for anti-aliasing
function getRoundedRectAlpha(x, y, w, h, r) {
  // Center is at w/2, h/2
  const qx = Math.abs(x - w / 2) - (w / 2 - r);
  const qy = Math.abs(y - h / 2) - (h / 2 - r);
  const dist = Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2) + Math.min(Math.max(qx, qy), 0) - r;
  
  if (dist <= -0.5) return 1.0;
  if (dist >= 0.5) return 0.0;
  return 0.5 - dist; // smooth step between -0.5 and +0.5
}

for (let y = 0; y < targetSize; y++) {
  for (let x = 0; x < targetSize; x++) {
    const idx = (y * targetSize + x) * 4;
    const alphaRect = getRoundedRectAlpha(x + 0.5, y + 0.5, targetSize, targetSize, radius);

    if (alphaRect <= 0) {
      // transparent outside rounded rect
      outPixels[idx] = 0;
      outPixels[idx + 1] = 0;
      outPixels[idx + 2] = 0;
      outPixels[idx + 3] = 0;
      continue;
    }

    // Base background: Pure White (#FFFFFF)
    let r = 255;
    let g = 255;
    let b = 255;
    let a = alphaRect;

    // Check if pixel falls inside the inner building area (with Bilinear sampling)
    const srcX = (x - padding) * (width / innerSize);
    const srcY = (y - padding) * (height / innerSize);

    if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
      // Bilinear sampling from srcPixels
      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, width - 1);
      const y1 = Math.min(y0 + 1, height - 1);
      const fx = srcX - x0;
      const fy = srcY - y0;

      const idx00 = (y0 * width + x0) * 4;
      const idx10 = (y0 * width + x1) * 4;
      const idx01 = (y1 * width + x0) * 4;
      const idx11 = (y1 * width + x1) * 4;

      const interpolate = (ch) => {
        const top = srcPixels[idx00 + ch] * (1 - fx) + srcPixels[idx10 + ch] * fx;
        const btm = srcPixels[idx01 + ch] * (1 - fx) + srcPixels[idx11 + ch] * fx;
        return top * (1 - fy) + btm * fy;
      };

      const srcR = interpolate(0);
      const srcG = interpolate(1);
      const srcB = interpolate(2);
      const srcA = interpolate(3) / 255;

      // Alpha compositing over white
      r = Math.round(srcR * srcA + 255 * (1 - srcA));
      g = Math.round(srcG * srcA + 255 * (1 - srcA));
      b = Math.round(srcB * srcA + 255 * (1 - srcA));
    }

    outPixels[idx] = r;
    outPixels[idx + 1] = g;
    outPixels[idx + 2] = b;
    outPixels[idx + 3] = Math.round(a * 255);
  }
}

// 4. Encode to PNG
function createPNG(w, h, rgba) {
  const lineSize = w * 4;
  const filtered = Buffer.alloc(h * (lineSize + 1));
  let p = 0;
  for (let y = 0; y < h; y++) {
    filtered[p++] = 0; // Filter None
    const lineStart = y * lineSize;
    for (let x = 0; x < lineSize; x++) {
      filtered[p++] = rgba[lineStart + x];
    }
  }

  const compressed = zlib.deflateSync(filtered, { level: 9 });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.concat([typeBuf, data]);
    const crc = crc32(crcBuf);
    const crcOut = Buffer.alloc(4);
    crcOut.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcOut]);
  }

  // Simple CRC32 table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // 8 bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const faviconPngBuf = createPNG(targetSize, targetSize, outPixels);
fs.writeFileSync('public/favicon.png', faviconPngBuf);
console.log('Successfully written public/favicon.png (' + faviconPngBuf.length + ' bytes)');

// 5. Generate high-res SVG favicon with white rounded background
const base64Building = rawBuf.toString('base64');
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="320" height="320">
  <defs>
    <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.12" />
    </filter>
  </defs>
  <!-- Background White Rounded Card -->
  <rect x="0" y="0" width="320" height="320" rx="64" fill="#ffffff" filter="url(#soft-shadow)" />
  <!-- 3D College Building -->
  <image href="data:image/png;base64,${base64Building}" x="16" y="16" width="288" height="288" preserveAspectRatio="xMidYMid meet" />
</svg>
`;

fs.writeFileSync('public/favicon.svg', svgContent, 'utf-8');
console.log('Successfully written public/favicon.svg');
