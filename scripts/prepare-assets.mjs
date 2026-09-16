import sharp from 'sharp';
await sharp('public/images/hero-night-meadow.png').webp({ quality: 88 }).toFile('public/images/hero-night-meadow.webp');
for (const size of [192, 512]) {
 const svg = `<svg width="${size}" height="${size}"><rect width="100%" height="100%" rx="60" fill="#080c22"/><text x="50%" y="57%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="${size*.46}" fill="#d4f994">PC</text></svg>`;
 await sharp(Buffer.from(svg)).png().toFile(`public/icon-${size}.png`);
}
