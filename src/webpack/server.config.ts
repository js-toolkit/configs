import { Configuration, WatchIgnorePlugin } from 'webpack';
import webpackMerge from 'webpack-merge';
import webpackNodeExternals from 'webpack-node-externals';
import appEnv from '../appEnv';
import paths from '../paths';
import appConfig from '../appConfig';
import commonConfig from './common.config';
import { clientDefaultRules, ClientConfigOptions } from './client.config';
import { mergeAndReplaceRules } from './utils';
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
  entry,
  rules,
  nodeExternalsOptions,
  isUniversal,
  useTypeScript,
  tsLoaderType = TsLoaderType.Default,
  tsconfig = paths.server.tsconfig,
}: ServerConfigOptions): Configuration => {
  const { tsBaseRule, ...rest } = isUniversal ? universalDefaultRules : serverDefaultRules;

  const preparedRules = useTypeScript
    ? {
        tsRule: {
          ...tsBaseRule,
          use: loaders.getTsLoader({ loaderType: tsLoaderType, forkedChecks: true, tsconfig }),
        },
        ...rest,
      }
    : { ...rest };

  const moduleRules = mergeAndReplaceRules(preparedRules, rules);

  return webpackMerge(
    commonConfig({
      outputPath: paths.server.output.path,
      outputPublicPath: appConfig.server.output.publicPath,
      outputJsDir: '',
      hash: false,
      useTypeScript,
      tsLoaderType,
      tsconfig,
    }),
    {
      name: appConfig.server.root,
      target: 'node',

      context: isUniversal ? paths.root : paths.server.sources,

      entry,

      resolve: {
        modules: [isUniversal ? paths.client.sources : paths.server.sources],
        alias: isUniversal
          ? {
              server: paths.server.sources,
              shared: paths.shared.sources,
              client: paths.client.sources,
            }
          : undefined,
      },

      // http://jlongster.com/Backend-Apps-with-Webpack--Part-I
      externals: webpackNodeExternals(nodeExternalsOptions),

      stats: 'errors-only',
      // stats: {
      //   colors: true,
      //   cached: false, // Add information about cached (not built) modules
      // },

      module: {
        rules: Object.getOwnPropertyNames(moduleRules).map(name => moduleRules[name] || {}),
      },

      plugins: [
        // Don't watch on client files when ssr is turned off because client by self make hot update
        // and server not needs in updated files because server not render react components.
        ...(!isUniversal || appEnv.ssr ? [] : [new WatchIgnorePlugin([paths.client.root])]),
      ],
    }
  );
};
