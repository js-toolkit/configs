import fs from 'fs';
import path from 'path';

export interface GetInstalledPackageOptions {
  requireFn?: typeof require;
  resolveFromCwd?: boolean;
}

/**
 * Resolves a package from the linted project's perspective (process.cwd()).
 *
 * - If the project has its own node_modules: only accept packages from
 *   cwd/node_modules (reject hoisted deps from root that the project doesn't have).
 * - If the project has no node_modules (flat workspace): accept resolution from root.
 *
 * @param resolveFromCwd - when true, resolve from cwd; when false (default), use plain require.
 */
export function getInstalledPackage(
  name: string,
  options: GetInstalledPackageOptions = {}
): string | undefined {
  const { requireFn = require, resolveFromCwd = false } = options;

  try {
    if (!resolveFromCwd) {
      requireFn(name);
      return name;
    }

    const resolved = requireFn.resolve(name, { paths: [process.cwd()] });
    const cwdNodeModules = path.resolve(process.cwd(), 'node_modules');
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
