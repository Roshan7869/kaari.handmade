import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const assetsDir = 'src/assets';
const publicDir = 'public';

async function convertToWebP(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Get sizes for comparison
    const originalSize = fs.statSync(inputPath).size;
    const newSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    console.log(`✓ Converted: ${path.basename(inputPath)} -> ${path.basename(outputPath)} (saved ${savings}%)`);

    // Remove original if conversion successful
    fs.unlinkSync(inputPath);
  } catch (error) {
    console.error(`✗ Failed to convert ${inputPath}:`, error.message);
  }
}

async function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      await processDirectory(filePath);
    } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
      const baseName = path.basename(file, path.extname(file));
      const outputPath = path.join(dir, `${baseName}.webp`);
      await convertToWebP(filePath, outputPath);
    }
  }
}

async function main() {
  console.log('Converting images to WebP...\n');

  await processDirectory(assetsDir);
  await processDirectory(publicDir);

  console.log('\n✓ Image conversion complete!');
}

main();