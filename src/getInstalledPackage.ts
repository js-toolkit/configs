import { defaultRequire } from './defaultRequire.ts';

export interface GetInstalledPackageOptions {
  requireFn?: NodeRequire;
  resolvePaths?: string[] | boolean;
}

/**
 * Resolves a package from the linted project's perspective (process.cwd()).
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
    requireFn.resolve(name, { paths });
    return name;
    // const resolved = requireFn.resolve(name, { paths });
    // const cwdNodeModules = findPath('node_modules', paths);
    // if (!cwdNodeModules) return name;
    // const isLocal = !path.relative(cwdNodeModules, resolved).startsWith('..');
    // return isLocal ? name : undefined;
  } catch {
    return undefined;
  }
}
