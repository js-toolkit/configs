import { getInstalledPackage } from '../getInstalledPackage';
import type { AnyObject } from '../types';

export function getInstalledPlugin(
  name: string,
  options?: AnyObject
): string | [string, AnyObject] | undefined {
  const plugin = getInstalledPackage(name);
  if (!plugin) return undefined;
  return options ? [plugin, options] : plugin;
}
