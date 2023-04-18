import { getInstalledPackage } from '../getInstalledPackage';

export function getInstalledPlugin(
  name: string,
  options?: AnyObject | undefined
): string | [string, AnyObject] | undefined {
  const plugin = getInstalledPackage(name);
  if (!plugin) return undefined;
  return options ? [plugin, options] : plugin;
}
