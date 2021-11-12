export function getInstalledPackage(name: string): string | undefined {
  try {
    require(name);
    return name;
  } catch {
    return undefined;
  }
}
