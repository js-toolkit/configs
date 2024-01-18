import buildConfigDefaults, { type BuildConfigDefaults } from './buildConfigDefaults';

export interface BuildConfig extends Omit<BuildConfigDefaults, 'client' | 'server' | 'shared'> {
  client: BuildConfigDefaults['client'] | false | undefined;
  server: BuildConfigDefaults['server'] | false | undefined;
  shared: BuildConfigDefaults['shared'] | false | undefined;

  default: BuildConfigDefaults;

  envStringify(): { 'process.env.buildConfig': string };
}

export function resolveConfigPath(moduleNames = ['build.config'], paths = [process.cwd()]): string {
  let module = '';
  for (let i = 0, name = moduleNames[i]; i < moduleNames.length; i += 1) {
    try {
      // With node 12 it is needed to use prefix './'
      module = require.resolve(`./${name}`, { paths });
      if (module) {
        return module;
      }
    } catch {
      // Ignore errors
    }
  }
  return module;
}

// eslint-disable-next-line @typescript-eslint/ban-types
function merge<T1 extends AnyObject, T2 extends Partial<T1>>(
  defaults: T1,
  nextValues: T2
): Omit<T1, keyof T2> & T2 {
  return Array.from(
    new Set([...Object.getOwnPropertyNames(defaults), ...Object.getOwnPropertyNames(nextValues)])
  ).reduce(
    (acc, key) => {
      const p = key as keyof (T1 | T2);
      // Merge arrays
      if (Array.isArray(defaults[p]) || Array.isArray(nextValues[p])) {
        // Apply empty array if nextValues[p] is empty otherwise merge them
        // acc[p] = nextValues[p].length === 0 ? nextValues[p] : [...defaults[p], ...nextValues[p]];
        // If at least on value is array just rewrite
        acc[p] = nextValues[p] ?? defaults[p];
      }
      // Merge objects
      else if (typeof defaults[p] === 'object' && typeof nextValues[p] === 'object') {
        acc[p] = merge(defaults[p], nextValues[p] ?? {}) as any;
      }
      // Replace default values from obj2 if exists
      else {
        acc[p] = (p in nextValues ? nextValues[p] : defaults[p]) as (typeof acc)[typeof p];
      }
      return acc;
    },
    {} as Omit<T1, keyof T2> & T2
  );
}

export function getBuildConfig(configPath = resolveConfigPath()): BuildConfig {
  const buildConfig: BuildConfig =
    process.env.buildConfig ||
    (configPath
      ? // eslint-disable-next-line @typescript-eslint/no-var-requires
        merge(buildConfigDefaults, require(configPath))
      : ({
          ...buildConfigDefaults,
          client: false,
          server: false,
          shared: false,
        } satisfies Pick<BuildConfig, keyof BuildConfigDefaults>));

  return {
    ...buildConfig,

    default: buildConfigDefaults,

    /** Stringify all values that we can feed into Webpack DefinePlugin. */
    envStringify() {
      const json = JSON.stringify(this);
      return {
        'process.env.buildConfig': json,
      };
    },
  };
}

/** Use in runtime in browser environment only JSON convertable values, not functions! */
const buildConfig = getBuildConfig();

export default buildConfig;
