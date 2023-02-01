import { getInstalledPackage } from '../getInstalledPackage';

export function getInstalledPlugin(
  name: string,
  options?: {} | undefined
): string | [string, {}] | undefined {
  const plugin = getInstalledPackage(name);
  if (!plugin) return undefined;
  return options ? [plugin, options] : plugin;
}
