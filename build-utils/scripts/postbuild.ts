import fs from 'fs';

fs.writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }, undefined, 2));
