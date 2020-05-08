export default function getInstalledPlugin(
  name: string,
  options?: {}
): string | [string, {}] | undefined {
  try {
    require(name);
    return options ? [name, options] : name;
  } catch {
    return undefined;
  }
}
