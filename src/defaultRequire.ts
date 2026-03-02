import { createRequire } from 'module';

export const defaultRequire = createRequire(import.meta.url);
