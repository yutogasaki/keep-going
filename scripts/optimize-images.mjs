import sharp from 'sharp';
import { readdir, unlink } from 'fs/promises';
import { join } from 'path';

const PUBLIC = new URL('../public', import.meta.url).pathname;

async function optimizeDir(dir, { resize, quality = 80 }) {
  const files = await readdir(join(PUBLIC, dir));
  const pngs = files.filter((f) => f.endsWith('.png'));

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of pngs) {
    const src = join(PUBLIC, dir, file);
    const dest = join(PUBLIC, dir, file.replace('.png', '.webp'));

    let pipeline = sharp(src);
    const meta = await pipeline.metadata();
    totalBefore += meta.size ?? 0;

    if (resize) {
      pipeline = pipeline.resize(resize, resize);
    }

    const { size } = await pipeline.webp({ quality }).toFile(dest);
    totalAfter += size;

    await unlink(src);
    console.log(`  ${file} → ${file.replace('.png', '.webp')}  (${fmt(meta.size)} → ${fmt(size)})`);
  }

  return { totalBefore, totalAfter };
}

function fmt(bytes) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

console.log('ikimono/ (1024→512, WebP):');
const ikimono = await optimizeDir('ikimono', { resize: 512 });

console.log('\nmedal/ (WebP):');
const medal = await optimizeDir('medal', {});

const before = ikimono.totalBefore + medal.totalBefore;
const after = ikimono.totalAfter + medal.totalAfter;
console.log(`\nTotal: ${fmt(before)} → ${fmt(after)} (${((1 - after / before) * 100).toFixed(0)}% reduction)`);
