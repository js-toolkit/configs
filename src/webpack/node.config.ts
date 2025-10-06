import type { Configuration, ExternalItem } from 'webpack';
import webpackNodeExternals from 'webpack-node-externals';
import appEnv from '../appEnv';
import paths from '../paths';
import buildConfig from '../buildConfig';
import commonConfig from './common.config';
import { webDefaultRules, type WebConfigOptions, prepareRules } from './web.config';
import { TsLoaderType, css, cssNodeModules, getTsLoader } from './loaders';
import type { RequiredStrict } from './types';

export const nodeDefaultRules: Pick<typeof webDefaultRules, 'jsRule' | 'tsBaseRule'> = {
  jsRule: {
    ...webDefaultRules.jsRule,
    include: [paths.node.sources, paths.shared.sources].filter((v) => !!v),
  },
  tsBaseRule: {
    ...webDefaultRules.tsBaseRule,
    include: [paths.node.sources, paths.shared.sources].filter((v) => !!v),
  },
};

export const universalDefaultRules: typeof webDefaultRules = {
  jsRule: {
    ...webDefaultRules.jsRule,
    include: [...(webDefaultRules.jsRule.include as string[]), paths.node.sources],
  },
  tsBaseRule: {
    ...nodeDefaultRules.tsBaseRule,
    include: [...(webDefaultRules.jsRule.include as string[]), paths.node.sources],
  },
  cssRule: {
    ...webDefaultRules.cssRule,
    // process css in server side always in ssr mode
    use: css({ ssr: true, extractor: !appEnv.dev }),
  },
  cssNodeModulesRule: {
    ...webDefaultRules.cssNodeModulesRule,
    // process css in server side always in ssr mode
    use: cssNodeModules({ ssr: true, extractor: !appEnv.dev }),
  },
  svgRule: {
    ...webDefaultRules.svgRule,
    generator: { emit: false },
  },
  fontRule: {
    ...webDefaultRules.fontRule,
    generator: { emit: false },
  },
  assetsRule: {
    ...webDefaultRules.assetsRule,
    generator: { emit: false },
  },
};

export interface NodeConfigOptions extends WebConfigOptions {
  nodeExternalsOptions?: webpackNodeExternals.Options | undefined;
  isUniversal?: boolean | undefined;
}

const nodeBuildConfig = buildConfig.node || buildConfig.default.node;

export default ({
  outputPath = paths.node.output.path,
  outputPublicPath = nodeBuildConfig.output.publicPath,
  outputJsDir = '',
  hash = false,
  chunkSuffix = '.chunk',
  typescript,
  rules: { tsBaseRule, ...rules } = {},
  nodeExternalsOptions,
  isUniversal,
  ...restOptions
}: NodeConfigOptions): Configuration => {
  const tsConfig: RequiredStrict<Extract<NodeConfigOptions['typescript'], object>> = {
    configFile: paths.node.tsconfig,
    loader: TsLoaderType.Default,
    loaderOptions: {},
    forkedChecks: false,
    checkerOptions: {},
    threadLoader: false,
    threadLoaderOptions: {},
    ...(typeof typescript === 'object'
      ? (typescript as RequiredStrict<typeof typescript>)
      : undefined),
  };

  const { tsBaseRule: defaultTsBaseRule, ...restDefaultRules } = isUniversal
    ? universalDefaultRules
    : nodeDefaultRules;

  const defaultRules = {
    tsRule: {
      ...defaultTsBaseRule,
      ...tsBaseRule,
      use: getTsLoader({
        tsconfig: tsConfig.configFile,
        forkedChecks: tsConfig.forkedChecks,
        useThreadLoader: tsConfig.threadLoader,
        threadLoaderOptions: tsConfig.threadLoaderOptions,
        ...tsConfig.loaderOptions,
        loaderType: tsConfig.loader,
      }),
    },
    ...restDefaultRules,
  };

  const preparedRules = prepareRules(rules, defaultRules);

  const moduleRules = { ...defaultRules, ...preparedRules };

  return commonConfig({
    outputPath,
    outputPublicPath,
    outputJsDir,
    hash,
    chunkSuffix,
    typescript: typescript
      ? {
          ...tsConfig,
          checkerOptions: {
            ...tsConfig.checkerOptions,
            typescript: {
              ...tsConfig.checkerOptions.typescript,
              diagnosticsOptions: {
                syntactic: tsConfig.threadLoader, // ts-loader in happyPackMode will not check SyntacticErrors so let check it in this plugin
                ...tsConfig.checkerOptions.typescript?.diagnosticsOptions,
              },
            },
          },
        }
      : undefined,

    name: nodeBuildConfig.root,
    target: 'node',

    context: isUniversal ? paths.root : paths.node.sources,

    ...restOptions,

    stats:
      restOptions.stats === false || (restOptions.stats && typeof restOptions.stats !== 'object')
        ? restOptions.stats
        : {
            all: false,
            errors: true,
            errorDetails: true,
            warnings: true,
            version: true,
            timings: true,
            builtAt: true,
            entrypoints: true,
            ...restOptions.stats,
          },

    // http://jlongster.com/Backend-Apps-with-Webpack--Part-I
    externals: [
      webpackNodeExternals(nodeExternalsOptions) as ExternalItem,
      ...((restOptions.externals &&
        (Array.isArray(restOptions.externals) ? restOptions.externals : [restOptions.externals])) ||
        []),
    ],

    resolve: {
      ...restOptions.resolve,
      modules: [
        isUniversal ? paths.web.sources : paths.node.sources,
        ...((restOptions.resolve && restOptions.resolve.modules) || []),
      ],
      alias: {
        ...(isUniversal
          ? {
              node: paths.node.sources,
              web: paths.web.sources,
            }
          : undefined),
        ...(paths.shared.sources ? { shared: paths.shared.sources } : undefined),
        ...((restOptions.resolve && restOptions.resolve.alias) || undefined),
      },
    },

    module: {
      ...restOptions.module,
      rules: [
        ...Object.getOwnPropertyNames(moduleRules).map(
          (name) => moduleRules[name as keyof typeof moduleRules] || {}
        ),
        ...((restOptions.module && restOptions.module.rules) || []),
      ],
    },

    watchOptions: {
      // Don't watch on client files when isUniversal is true and ssr is turned off
      // because client by self make hot update and server not needs in updated files
      // because server not render react components.
      ignored: [paths.nodeModules.root, ...(isUniversal && !appEnv.ssr ? [paths.web.root] : [])],
      ...restOptions.watchOptions,
    },
  });
};
