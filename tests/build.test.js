const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');

describe('Build System & Architectural Constraints', () => {
    test('scripts/build.js executes cleanly and outputs index.html', () => {
        const out = execSync('node scripts/build.js', { cwd: ROOT, encoding: 'utf8' });
        assert.ok(out.includes('build.js: wrote index.html'));
        const indexPath = path.join(ROOT, 'index.html');
        assert.ok(fs.existsSync(indexPath));
    });

    test('All HTML and CSS files remain strictly below 10,000 lines (Requirement 10)', () => {
        function checkDir(dir) {
            for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, f.name);
                if (f.isDirectory()) {
                    if (f.name === 'node_modules' || f.name === '.git' || f.name === 'android' || f.name === 'ios' || f.name === 'www') continue;
                    checkDir(full);
                } else if (/\.(html|css)$/.test(f.name)) {
                    const content = fs.readFileSync(full, 'utf8');
                    const lines = content.split('\n').length;
                    assert.ok(lines < 10000, `File ${path.relative(ROOT, full)} has ${lines} lines, exceeding the 10,000 line limit!`);
                }
            }
        }
        checkDir(ROOT);
    });

    test('All partials referenced by index.src.html exist', () => {
        const srcTemplate = path.join(ROOT, 'src', 'pages', 'index.src.html');
        assert.ok(fs.existsSync(srcTemplate));
        const content = fs.readFileSync(srcTemplate, 'utf8');
        const matches = [...content.matchAll(/<!--\s*@include:([^\s]+)\s*-->/g)];
        assert.ok(matches.length > 0, 'Should find include directives');

        for (const m of matches) {
            const rel = m[1];
            const target = path.join(ROOT, 'src', 'pages', rel);
            assert.ok(fs.existsSync(target), `Missing partial included: ${rel}`);
        }
    });
});
