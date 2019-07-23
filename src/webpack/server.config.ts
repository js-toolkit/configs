import { Configuration } from 'webpack';
import webpackNodeExternals from 'webpack-node-externals';
import appEnv from '../appEnv';
import paths from '../paths';
import appConfig from '../appConfig';
import commonConfig from './common.config';
import { clientDefaultRules, ClientConfigOptions } from './client.config';
import loaders, { TsLoaderType } from './loaders';

export const serverDefaultRules = {
  jsRule: {
    ...clientDefaultRules.jsRule,
    include: [paths.server.sources, paths.shared.sources],
  },
  tsBaseRule: {
    ...clientDefaultRules.tsBaseRule,
    include: [paths.server.sources, paths.shared.sources],
  },
};

export const universalDefaultRules: typeof clientDefaultRules = {
  jsRule: {
    ...clientDefaultRules.jsRule,
    include: [...(clientDefaultRules.jsRule.include as string[]), paths.server.sources],
  },
  tsBaseRule: {
    ...serverDefaultRules.tsBaseRule,
    include: [...(clientDefaultRules.jsRule.include as string[]), paths.server.sources],
  },
  cssRule: {
    ...clientDefaultRules.cssRule,
    // process css in server side always in ssr mode
    use: loaders.css({ ssr: true }),
  },
  cssNodeModulesRule: {
    ...clientDefaultRules.cssNodeModulesRule,
    // process css in server side always in ssr mode
    use: loaders.cssNodeModules({ ssr: true }),
  },
  assetsRule: {
    ...clientDefaultRules.assetsRule,
    use: loaders.assets({ ssr: true }),
  },
};

export interface ServerConfigOptions extends ClientConfigOptions {
  nodeExternalsOptions?: webpackNodeExternals.Options;
  isUniversal?: boolean;
}

export default ({
  outputPath = paths.server.output.path,
  outputPublicPath = appConfig.server.output.publicPath,
  outputJsDir = '',
  hash = false,
  useTypeScript,
  tsLoaderType = TsLoaderType.Default,
  tsconfig = paths.server.tsconfig,
  useTsForkedChecks = true,
  entry,
  rules: { tsBaseRule, ...rules } = {},
  nodeExternalsOptions,
  isUniversal,
  ...restOptions
}: ServerConfigOptions): Configuration => {
  const { tsBaseRule: defaultTsBaseRule, ...restRules } = isUniversal
    ? universalDefaultRules
    : serverDefaultRules;

  const preparedRules = useTypeScript
    ? {
        tsRule: {
          ...defaultTsBaseRule,
          ...tsBaseRule,
          use: loaders.getTsLoader({
            loaderType: tsLoaderType,
            forkedChecks: useTsForkedChecks,
            tsconfig,
          }),
        },
        ...restRules,
      }
    : { ...restRules };

  const moduleRules = { ...preparedRules, ...rules };

  return commonConfig({
    outputPath,
    outputPublicPath,
    outputJsDir,
    hash,
    useTypeScript,
    tsLoaderType,
    tsconfig,
    useTsForkedChecks,

    name: appConfig.server.root,
    target: 'node',

    context: isUniversal ? paths.root : paths.server.sources,

    entry,

    stats: 'errors-only',
    // stats: {
    //   colors: true,
    //   cached: false, // Add information about cached (not built) modules
    // },

    ...restOptions,

    // http://jlongster.com/Backend-Apps-with-Webpack--Part-I
    externals: [
      webpackNodeExternals(nodeExternalsOptions),
      ...((restOptions.externals &&
        (Array.isArray(restOptions.externals) ? restOptions.externals : [restOptions.externals])) ||
        []),
    ],

    resolve: {
      ...restOptions.resolve,
      modules: [
        isUniversal ? paths.client.sources : paths.server.sources,
        ...((restOptions.resolve && restOptions.resolve.modules) || []),
      ],
      alias: isUniversal
        ? {
            server: paths.server.sources,
            shared: paths.shared.sources,
            client: paths.client.sources,
            ...((restOptions.resolve && restOptions.resolve.alias) || undefined),
          }
        : undefined,
    },

    module: {
      ...restOptions.module,
      rules: [
        ...Object.getOwnPropertyNames(moduleRules).map(name => moduleRules[name] || {}),
        ...((restOptions.module && restOptions.module.rules) || []),
      ],
    },

    watchOptions: {
      // Don't watch on client files when isUniversal is true and ssr is turned off
      // because client by self make hot update and server not needs in updated files
      // because server not render react components.
      ignored: [paths.nodeModules.root, ...(isUniversal && !appEnv.ssr ? [paths.client.root] : [])],
      ...restOptions.watchOptions,
    },
  });
};
