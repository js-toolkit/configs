import fs from 'fs';
import { findPath } from './findPath.ts';

export function getProjectDependencies(resolvePath: string | string[]): Set<string> {
  const pkgPath = findPath(
    'package.json',
    typeof resolvePath === 'string' ? [resolvePath] : resolvePath,
  );

  if (!pkgPath) return new Set();

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  return new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);
}
