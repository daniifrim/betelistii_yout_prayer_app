import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function convertToPng() {
  const svgPath = path.join(__dirname, '..', 'betelistii_red.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // Ensure the icons directory exists
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Copy SVG to icons directory
  fs.copyFileSync(
    svgPath, 
    path.join(iconsDir, 'betelistii_red.svg')
  );

  // Create 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192x192.png'));

  console.log('Created 192x192 icon');

  // Create 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512x512.png'));

  console.log('Created 512x512 icon');

  console.log('Icon conversion complete');
}

convertToPng().catch(console.error);