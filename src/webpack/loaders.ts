/* eslint-disable @typescript-eslint/explicit-function-return-type */
import type { RuleSetUseItem } from 'webpack';
import appEnv from '../appEnv';
import paths from '../paths';
import buildConfig from '../buildConfig';
import nodeRequire from './nodeRequire';

export interface BaseTsOptions {
  tsconfig: string;
}

export enum TsLoaderType {
  Default = 'ts',
  ATL = 'atl',
  Babel = 'babel',
}

interface GetTsLoaderOptionsBase extends BaseTsOptions {
  loaderType: TsLoaderType;
}

interface GetTsDefaultLoaderOptions extends GetTsLoaderOptionsBase {
  loaderType: TsLoaderType.Default;
  forkedChecks?: boolean | undefined;
  useThreadLoader?: boolean | undefined;
  threadLoaderOptions?: Record<string, any> | undefined;
  afterLoaders?: Exclude<RuleSetUseItem, Function>[] | undefined;
}

type TsDefaultLoaderOptions = Omit<GetTsDefaultLoaderOptions, 'loaderType'> & Record<string, any>;

export type GetTsLoaderOptions = (GetTsLoaderOptionsBase | GetTsDefaultLoaderOptions) &
  Record<string, any>;

export type GetTsCheckerPluginOptions = { loaderType: TsLoaderType } & Record<string, any>;

export function ts({
  tsconfig,
  forkedChecks,
  useThreadLoader,
  threadLoaderOptions,
  afterLoaders,
  ...rest
}: TsDefaultLoaderOptions) {
  return [
    ...(useThreadLoader
      ? [
          // Must be placen on front of other loaders.
          // Useful without watch mode, because on every edit (compilation) thread-loader fork process and increase total time of build
          {
            loader: 'thread-loader',
            options: {
              // there should be 1 cpu for the fork-ts-checker-webpack-plugin
              workers: 1, // best for universal builds on my machine (2 core * 2 hyperthreads)
              poolTimeout: appEnv.ifDev(Infinity, undefined),
              ...threadLoaderOptions,
            },
          },
        ]
      : []),

    ...(afterLoaders || []),

    {
      loader: 'ts-loader',
      options: {
        configFile: tsconfig,
        transpileOnly: forkedChecks,
        happyPackMode: useThreadLoader, // use happyPackMode mode to speed-up compilation and reduce errors reported to webpack
        ...rest,
        compilerOptions: {
          // disable sourceMap in production by default
          ...appEnv.ifProd(() => ({ sourceMap: false }), undefined),
          ...rest.compilerOptions,
        },
      },
    },
  ];
}

export function getTsLoader({ loaderType, ...rest }: GetTsLoaderOptions) {
  if (loaderType === TsLoaderType.ATL) return atl(rest);
  if (loaderType === TsLoaderType.Babel) return babelLoader();
  return ts(rest);
}

/** In order to runs typescript type checker on a separate process. */
export function atlCheckerPlugin() {
  const getName = (): string => 'awesome-typescript-loader';
  const { CheckerPlugin } = nodeRequire(getName());
  return new CheckerPlugin();
}

/** In order to runs typescript type checker on a separate process. */
export function tsCheckerPlugin(options: Record<string, any> = {}) {
  const getName = (): string => 'fork-ts-checker-webpack-plugin';
  const Plugin = nodeRequire(getName());
  return new Plugin({
    ...options,
    typescript: {
      memoryLimit: 1024,
      ...options.typescript,
      diagnosticsOptions: {
        syntactic: false,
        semantic: true,
        declaration: false,
        global: false,
        ...options.typescript?.diagnosticsOptions,
      },
    },
  });
}

export function atl({ tsconfig, ...rest }: BaseTsOptions & Record<string, any>) {
  return {
    loader: 'awesome-typescript-loader',
    options: {
      configFileName: tsconfig,
      useBabel: false, // Also sets "target": "es201*" in tsconfig.json
      useCache: true,
      ...rest,
    },
  };
}

export function getTsCheckerPlugin({ loaderType, ...rest }: GetTsCheckerPluginOptions) {
  if (loaderType === TsLoaderType.ATL) return atlCheckerPlugin();
  return tsCheckerPlugin(rest);
}

export function tsRHL({ afterLoaders, ...rest }: TsDefaultLoaderOptions) {
  return ts({
    afterLoaders: [
      ...(afterLoaders || []),
      ...appEnv.ifDev(() => [{ loader: 'babel-loader' }], []),
    ],
    ...rest,
  });
}

export function atsRHL({ tsconfig, ...rest }: BaseTsOptions & Record<string, any>) {
  return [...appEnv.ifDev(() => [{ loader: 'babel-loader' }], []), atl({ tsconfig, ...rest })];
}

export function babelLoader(options?: Record<PropertyKey, any> | undefined) {
  return {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      cacheCompression: false,
      ...options,
    },
  };
}

export const cssExtractLoader = 'mini-css-extract-plugin/dist/loader';
// export const cssExtractLoader = 'extract-css-chunks-webpack-plugin/dist/loader';

/**
 * Problem of duplication css classes when use composes with css file from node_modules directory.
 * 1. It can occur when use different loaders for source and composing files.
 *    Solution: use the same loaders for source and composing files.
 */
export function css({
  ssr = false,
  pattern = '[name]__[local]--[hash:5]',
  prodPattern = '[hash:5]',
  postcss = true,
  extractor = false,
  modules,
  styleLoaderOptions,
  postcssLoaderOptions,
  ...cssLoaderOptions
}: {
  ssr?: boolean | undefined;
  pattern?: string | undefined;
  prodPattern?: string | undefined;
  postcss?: boolean | undefined;
  extractor?: boolean | undefined;
  modules?: Record<string, any> | boolean | undefined;
  styleLoaderOptions?: Record<string, unknown> | undefined;
  postcssLoaderOptions?: Record<string, unknown> | undefined;
} & Record<string, any> = {}): RuleSetUseItem[] {
  return [
    ...(!ssr
      ? [!extractor ? { loader: 'style-loader', options: styleLoaderOptions } : cssExtractLoader]
      : []),
    {
      loader: 'css-loader',
      options: {
        modules:
          modules != null && typeof modules !== 'object'
            ? // use provided string or boolean
              modules
            : // merge with defaults if provided object
              {
                mode: 'local',
                localIdentName: appEnv.ifDev(pattern, prodPattern),
                localIdentContext: paths.root, // https://github.com/webpack-contrib/css-loader/issues/267
                exportOnlyLocals: ssr,
                ...modules,
              },
        importLoaders: postcss ? 1 : undefined,
        ...cssLoaderOptions,
      },
    },
    ...(postcss ? [{ loader: 'postcss-loader', options: postcssLoaderOptions }] : []),
  ] as RuleSetUseItem[];
}

export function cssNodeModules(options: Parameters<typeof css>[0] = {}) {
  return css({
    pattern: '[local]',
    prodPattern: '[local]',
    // // In some cases have problems when build with modules because webpack requiring urls as modules.
    // // In this case you need define resolve.extensions in webpack config for those files.
    // // For example, font urls in katex.css.
    modules: false,
    ...options,
  });
}

export function assets({ ssr = false, ...restOptions }: Record<string, any> = {}) {
  return {
    // Embeds resources as DataUrl, or if the file size exceeds options.limit then redirects
    // to the file-loader with all specified parameters and it copies the files.
    loader: 'url-loader',
    options: {
      limit: 1024,
      fallback: 'file-loader',
      emitFile: !ssr,
      name: `${
        (buildConfig.client || buildConfig.default.client).output.assets
      }/[name].[hash:8].[ext]`, // Virtual hash useful for HRM during development.
      ...restOptions,
    },
  };
}
