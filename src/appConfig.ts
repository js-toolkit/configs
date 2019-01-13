import webpackMerge from 'webpack-merge';
import appConfigDefaults from './apprcDefaults';

export type AppConfig = typeof appConfigDefaults;

const moduleName = 'apprc';

function resolveConfigPath() {
  try {
    return require.resolve(moduleName, { paths: [process.cwd()] });
  } catch {
    return '';
  }
}

function getAppConfig() {
  const apprcPath = resolveConfigPath();

  const appConfig: AppConfig =
    (process.env.appConfig as any) ||
    (apprcPath
      ? (webpackMerge(appConfigDefaults as any, require(apprcPath) as any) as AppConfig)
      : appConfigDefaults);

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
