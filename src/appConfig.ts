import appConfigDefaults from './apprcDefaults';

export type AppConfig = typeof appConfigDefaults & {
  envStringify(): { 'process.env.appConfig': string };
};

function resolveConfigPath(): string {
  const moduleName = 'apprc';
  try {
    // With node 12 it is needed to use prefix './'
    return require.resolve(`./${moduleName}`, { paths: [process.cwd()] });
  } catch {
    return '';
  }
}

function merge<T1 extends {}, T2 extends Partial<T1>>(obj1: T1, obj2: T2): Omit<T1, keyof T2> & T2 {
  return Array.from(
    new Set([...Object.getOwnPropertyNames(obj1), ...Object.getOwnPropertyNames(obj2)])
  ).reduce((acc, p) => {
    if (Array.isArray(obj1[p]) && Array.isArray(obj2[p])) {
      acc[p] = [...obj1[p], ...obj2[p]];
    } else if (typeof obj1[p] === 'object' && typeof obj2[p] === 'object') {
      acc[p] = merge(obj1[p], obj2[p]);
    } else {
      acc[p] = p in obj2 ? obj2[p] : obj1[p];
    }
    return acc;
  }, {} as Omit<T1, keyof T2> & T2);
}

function getAppConfig(): AppConfig {
  const apprcPath = resolveConfigPath();

  const appConfig: AppConfig =
    process.env.appConfig ||
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    (apprcPath ? merge(appConfigDefaults, require(apprcPath)) : appConfigDefaults);

  return {
    ...appConfig,

    /** Stringify all values that we can feed into Webpack DefinePlugin. */
    envStringify() {
      return { 'process.env.appConfig': JSON.stringify(this) };
    },
  };
}

/** Use in runtime in browser environment only JSON convertable values, not functions! */
const appConfig = getAppConfig();

export default appConfig;
