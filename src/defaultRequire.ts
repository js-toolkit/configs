/* eslint-disable no-new-func */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-implied-eval */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { createRequire } from 'module';
import path from 'path';

/** Универсальный require, работает и в CJS и в ESM */
export const defaultRequire = createRequire(
  typeof __dirname !== 'undefined'
    ? path.join(__dirname, 'index.js') // CJS
    : new Function('return import.meta.url')() // ESM: Hide `import` from the parser, so it doesn't complain about using `import` in CJS.
);
