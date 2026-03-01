import { createRequire } from 'module';
import path from 'path';

/** Универсальный require, работает и в CJS и в ESM */
export const defaultRequire = createRequire(
  typeof __dirname !== 'undefined'
    ? path.join(__dirname, 'index.js') // CJS
    : // @ts-expect-error Universal require for ESM, createRequire needs a file path, but we can use the current module URL
      import.meta.url // ESM
);
