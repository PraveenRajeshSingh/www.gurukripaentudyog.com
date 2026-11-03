// Copies non-TypeScript build inputs (SQL migrations) into dist/ so the
// compiled migrator can find them. Cross-platform (CI runs Ubuntu, dev is Windows).
const fs = require('fs');
const path = require('path');

const from = path.resolve(__dirname, '../src/database/migrations');
const to = path.resolve(__dirname, '../dist/src/database/migrations');

if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
for (const file of fs.readdirSync(from).filter((f) => f.endsWith('.sql'))) {
  fs.copyFileSync(path.join(from, file), path.join(to, file));
  console.log('copied migration', file);
}
