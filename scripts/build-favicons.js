const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'public', 'favicon.svg');
const sizes = [32, 180, 192, 512];

(async () => {
  for (const size of sizes) {
    await sharp(src).resize(size, size).png().toFile(path.join(__dirname, 'public', `favicon-${size}.png`));
    console.log(`generated favicon-${size}.png`);
  }
  await sharp(src).resize(48, 48).toFile(path.join(__dirname, 'public', 'favicon.ico'));
  console.log('generated favicon.ico');
})();
