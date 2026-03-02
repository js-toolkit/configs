import { createRequire } from 'module';
import path from 'path';

export const defaultRequire = createRequire(path.join(__dirname, 'index.js'));
