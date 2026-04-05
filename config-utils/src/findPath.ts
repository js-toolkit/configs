import { existsSync } from 'fs';
import path from 'path';

export function findPath(relativePath: string, paths: string[]): string | undefined {
  for (const p of paths) {
    const pkgPath = path.resolve(p, relativePath);
    if (existsSync(pkgPath)) return pkgPath;
  }
  return undefined;
}
