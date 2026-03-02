import fs from 'fs';

fs.writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }, undefined, 2));

fs.renameSync('dist/cjs/defaultRequire.cjs.js', 'dist/cjs/defaultRequire.js');
