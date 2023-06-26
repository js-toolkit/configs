export function getInstalledPackage(
  name: string,
  requireFn: typeof require = require
): string | undefined {
  try {
    requireFn(name);
    return name;
  } catch {
    return undefined;
  }
}
