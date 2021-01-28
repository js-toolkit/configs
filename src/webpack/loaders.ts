import { RuleSetUseItem } from 'webpack';
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
  forkedChecks?: boolean;
  useThreadLoader?: boolean;
  threadLoaderOptions?: Record<string, any>;
  afterLoaders?: RuleSetUseItem[];
}

type TsDefaultLoaderOptions = Omit<GetTsDefaultLoaderOptions, 'loaderType'> & Record<string, any>;

export type GetTsLoaderOptions = (GetTsLoaderOptionsBase | GetTsDefaultLoaderOptions) &
  Record<string, any>;

export type GetTsCheckerPluginOptions = { loaderType: TsLoaderType } & Record<string, any>;

export default {
  getTsLoader({ loaderType, ...rest }: GetTsLoaderOptions) {
    if (loaderType === TsLoaderType.ATL) return this.atl(rest);
    if (loaderType === TsLoaderType.Babel) return this.babel();
    return this.ts(rest);
  },

  getTsCheckerPlugin({ loaderType, ...rest }: GetTsCheckerPluginOptions) {
    if (loaderType === TsLoaderType.ATL) return this.atlCheckerPlugin();
    return this.tsCheckerPlugin(rest);
  },

  ts({
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
                poolTimeout: appEnv.ifDevMode(Infinity, undefined),
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
            ...appEnv.ifProdMode(() => ({ sourceMap: false }), undefined),
            ...rest.compilerOptions,
          },
        },
      },
    ];
  },

  tsRHL({ afterLoaders, ...rest }: TsDefaultLoaderOptions) {
    return this.ts({
      afterLoaders: [
        ...(afterLoaders || []),
        ...appEnv.ifDevMode(() => [{ loader: 'babel-loader' }], []),
      ],
      ...rest,
    });
  },

  /** In order to runs typescript type checker on a separate process. */
  tsCheckerPlugin(options: Record<string, any> = {}) {
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
  },

  atl({ tsconfig, ...rest }: BaseTsOptions & Record<string, any>) {
    return {
      loader: 'awesome-typescript-loader',
      options: {
        configFileName: tsconfig,
        useBabel: false, // Also sets "target": "es201*" in tsconfig.json
        useCache: true,
        ...rest,
      },
    };
  },

  atsRHL({ tsconfig, ...rest }: BaseTsOptions & Record<string, any>) {
    return [
      ...appEnv.ifDevMode(() => [{ loader: 'babel-loader' }], []),
      this.atl({ tsconfig, ...rest }),
    ];
  },

  /** In order to runs typescript type checker on a separate process. */
  atlCheckerPlugin() {
    const getName = (): string => 'awesome-typescript-loader';
    const { CheckerPlugin } = nodeRequire(getName());
    return new CheckerPlugin();
  },

  babel(options?: Record<PropertyKey, any>) {
    return {
      loader: 'babel-loader',
      options: {
        cacheDirectory: true,
        cacheCompression: false,
        ...options,
      },
    };
  },

  // cssExtractLoader: 'mini-css-extract-plugin/dist/loader',
  cssExtractLoader: 'extract-css-chunks-webpack-plugin/dist/loader',
  /**
   * Problem of duplication css classes when use composes with css file from node_modules directory.
   * 1. It can occur when use different loaders for source and composing files.
   *    Solution: use the same loaders for source and composing files.
   */
  css({
    ssr = false,
    pattern = '[name]__[local]--[hash:5]',
    prodPattern = '[hash:5]',
    postcss = true,
    extractor = true,
    modules,
    styleLoaderOptions,
    postcssLoaderOptions,
    ...cssLoaderOptions
  }: {
    ssr?: boolean;
    pattern?: string;
    prodPattern?: string;
    postcss?: boolean;
    extractor?: boolean;
    modules?: Record<string, any> | boolean;
    styleLoaderOptions?: Record<string, unknown>;
    postcssLoaderOptions?: Record<string, unknown>;
  } & Record<string, any> = {}) {
    return [
      ...(!ssr
        ? [
            appEnv.dev || !extractor
              ? { loader: 'style-loader', options: styleLoaderOptions }
              : this.cssExtractLoader,
          ]
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
                  localIdentName: appEnv.ifDevMode(pattern, prodPattern),
                  localIdentContext: paths.root, // https://github.com/webpack-contrib/css-loader/issues/267
                  exportOnlyLocals: ssr,
                  ...modules,
                },
          importLoaders: postcss ? 1 : undefined,
          ...cssLoaderOptions,
        },
      },
      ...(postcss ? [{ loader: 'postcss-loader', options: postcssLoaderOptions }] : []),
    ];
  },

  cssNodeModules(options: Record<string, any> = {}) {
    return this.css({
      pattern: '[local]',
      prodPattern: '[local]',
      // // In some cases have problems when build with modules because webpack requiring urls as modules.
      // // In this case you need define resolve.extensions in webpack config for those files.
      // // For example, font urls in katex.css.
      modules: false,
      ...options,
    });
  },

  assets({ ssr = false, ...restOptions }: Record<string, any> = {}) {
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
  },
};
