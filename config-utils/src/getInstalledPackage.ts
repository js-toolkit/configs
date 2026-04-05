import { defaultRequire } from './defaultRequire.ts';

export interface GetInstalledPackageOptions {
  requireFn?: NodeJS.Require;
  resolvePaths?: string[] | boolean;
}

/**
 * Resolves a package from the linted project's perspective (process.cwd()).
 */
export function getInstalledPackage(
  name: string,
  options: GetInstalledPackageOptions = {},
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
  } catch {
    return undefined;
  }
}
