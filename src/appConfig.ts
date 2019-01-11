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

  const appConfig: AppConfig = apprcPath
    ? (webpackMerge(appConfigDefaults as any, require(apprcPath) as any) as AppConfig)
    : appConfigDefaults;
  return appConfig;
}

/** Do not use it in runtime in browser environment! */
const appConfig = getAppConfig();

export default appConfig;
