import fs from 'fs';
import path from 'path';
import { defaultRequire } from './defaultRequire.ts';

export interface GetInstalledPackageOptions {
  requireFn?: NodeRequire;
  resolvePaths?: string[] | boolean;
}

/**
 * Resolves a package from the linted project's perspective (process.cwd()).
 *
 * - If the project has its own node_modules: only accept packages from
 *   cwd/node_modules (reject hoisted deps from root that the project doesn't have).
 * - If the project has no node_modules (flat workspace): accept resolution from root.
 *
 * @param resolvePaths - when true, resolve from cwd; when false (default), use plain require.
 */
export function getInstalledPackage(
  name: string,
  options: GetInstalledPackageOptions = {}
): string | undefined {
  const { requireFn = defaultRequire, resolvePaths = false } = options;

  try {
    if (!resolvePaths || (Array.isArray(resolvePaths) && resolvePaths.length === 0)) {
      requireFn(name);
      return name;
    }

    const paths = resolvePaths === true ? [process.cwd()] : resolvePaths;
    const resolved = requireFn.resolve(name, { paths });
    const cwdNodeModules = path.resolve(...paths, 'node_modules');
    const hasOwnNodeModules = fs.existsSync(cwdNodeModules);
    if (!hasOwnNodeModules) {
      return name;
    }
    const isLocal = !path.relative(cwdNodeModules, resolved).startsWith('..');
    return isLocal ? name : undefined;
  } catch {
    return undefined;
  }
}
