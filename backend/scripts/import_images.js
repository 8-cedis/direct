const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', '..', 'New folder');
const destDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(srcDir)) {
  console.error('Source directory does not exist:', srcDir);
  process.exit(1);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const allowed = /\.(jpe?g|png|gif|webp|svg)$/i;
const files = fs.readdirSync(srcDir).filter((f) => allowed.test(f));

if (files.length === 0) {
  console.log('No image files found in', srcDir);
  process.exit(0);
}

const mappings = [];
for (const file of files) {
  const ext = path.extname(file);
  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const filename = `${unique}${ext}`;
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(destDir, filename);
  try {
    fs.copyFileSync(srcPath, destPath);
    const url = `http://localhost:5000/uploads/${filename}`;
    mappings.push({ original: file, filename, url });
    console.log(`Copied ${file} -> ${filename}`);
  } catch (err) {
    console.error('Failed to copy', file, err.message);
  }
}

const mapFile = path.join(destDir, 'import-mapping.json');
fs.writeFileSync(mapFile, JSON.stringify(mappings, null, 2), 'utf8');
console.log('\nImport complete. Mapping written to', mapFile);
console.log('Sample URLs:');
mappings.forEach(m => console.log(m.url));
