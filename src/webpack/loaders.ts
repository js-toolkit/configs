import { Loader } from 'webpack';
import appEnv from '../appEnv';
import paths from '../paths';
import appConfig from '../appConfig';
import nodeRequire from './nodeRequire';

export interface BaseTsOptions {
  tsconfig: string;
}

export enum TsLoaderType {
  Default = 1,
  ATL,
  Babel,
}

interface GetTsLoaderOptionsBase extends BaseTsOptions {
  loaderType: TsLoaderType;
}

interface GetTsDefaultLoaderOptions extends GetTsLoaderOptionsBase {
  loaderType: TsLoaderType.Default;
  forkedChecks?: boolean;
  afterLoaders?: Loader[];
}

type TsDefaultLoaderOptions = Pick<
  GetTsDefaultLoaderOptions,
  Exclude<keyof GetTsDefaultLoaderOptions, 'loaderType'>
> &
  Record<string, any>;

export type GetTsLoaderOptions = (GetTsLoaderOptionsBase | GetTsDefaultLoaderOptions) &
  Partial<Record<string, any>>;

export type GetTsCheckerPluginOptions = { loaderType: TsLoaderType } & BaseTsOptions &
  Partial<Record<string, any>>;

export default {
  getTsLoader({ loaderType, ...rest }: GetTsLoaderOptions) {
    if (loaderType === TsLoaderType.ATL) return this.atl(rest);
    if (loaderType === TsLoaderType.Babel) return this.babel(rest);
    return this.ts(rest);
  },

  getTsCheckerPlugin({ loaderType, ...rest }: GetTsCheckerPluginOptions) {
    if (loaderType === TsLoaderType.ATL) return this.atlCheckerPlugin();
    return this.tsCheckerPlugin(rest as BaseTsOptions);
  },

  ts({ tsconfig, forkedChecks, afterLoaders, ...rest }: TsDefaultLoaderOptions) {
    return [
      ...(forkedChecks && appEnv.prod
        ? [
            // Must be placen on front of other loaders.
            // Useful without watch mode, because on every edit (compilation) thread-loader fork process and increase total time of build
            {
              loader: 'thread-loader',
              options: {
                // there should be 1 cpu for the fork-ts-checker-webpack-plugin
                workers: 1, // best for universal builds
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
          happyPackMode: forkedChecks && appEnv.prod, // use happyPackMode mode to speed-up compilation and reduce errors reported to webpack
          ...rest,
          compilerOptions: {
            // disable sourceMap in production by default
            ...appEnv.ifProdMode({ sourceMap: false }, undefined),
            ...rest.compilerOptions,
          },
        },
      },
    ];
  },

  tsRHL({ tsconfig, forkedChecks, afterLoaders, ...rest }: TsDefaultLoaderOptions) {
    return this.ts({
      tsconfig,
      forkedChecks,
      afterLoaders: [
        ...(afterLoaders || []),
        ...appEnv.ifDevMode([{ loader: 'babel-loader' }], []),
      ],
      ...rest,
    });
  },

  /** In order to runs typescript type checker on a separate process. */
  tsCheckerPlugin({ tsconfig, ...rest }: BaseTsOptions & Record<string, any>) {
    const getName = (): string => 'fork-ts-checker-webpack-plugin';
    const Plugin = nodeRequire(getName());
    return new Plugin({
      tsconfig,
      compilerOptions: {
        noEmit: true,
      },
      useTypescriptIncrementalApi: true,
      checkSyntacticErrors: appEnv.prod, // ts-loader in happyPackMode will not check SyntacticErrors so let check it in this plugin
      memoryLimit: 1024,
      ...rest,
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
    return [...appEnv.ifDevMode([{ loader: 'babel-loader' }], []), this.atl({ tsconfig, ...rest })];
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
        ...options,
      },
    };
  },

  cssExtractLoader: 'mini-css-extract-plugin/dist/loader',
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
    finishLoader = true,
    ...options
  }: {
    ssr?: boolean;
    pattern?: string;
    prodPattern?: string;
    postcss?: boolean;
    finishLoader?: boolean;
  } & Record<string, any> = {}) {
    const { modules, ...rest } = options;
    return [
      ...(!ssr && finishLoader ? [appEnv.ifDevMode('style-loader', this.cssExtractLoader)] : []),
      {
        loader: 'css-loader',
        options: {
          modules:
            modules != null && typeof modules !== 'object'
              ? // override if provided string or boolean
                modules
              : // merge if provided object
                {
                  mode: 'local',
                  localIdentName: appEnv.ifDevMode(pattern, prodPattern),
                  context: paths.root, // https://github.com/webpack-contrib/css-loader/issues/267
                  ...modules,
                },
          importLoaders: postcss ? 1 : undefined,
          sourceMap: appEnv.dev,
          onlyLocals: ssr,
          ...rest,
        },
      },
      ...(postcss ? ['postcss-loader'] : []),
    ];
  },

  cssNodeModules({ ssr = false, postcss = true, ...rest } = {}) {
    return this.css({
      ssr,
      postcss,
      pattern: '[local]',
      prodPattern: '[local]',
      // In some cases have problems when build with modules because webpack requiring urls as modules.
      // In this case you need define resolve.extensions in webpack config for those files.
      // For example, font urls in katex.css.
      modules: false,
      ...rest,
    } as any);
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
        name: `${appConfig.client.output.assets}/[name].[hash:8].[ext]`, // Virtual hash useful for HRM during development.
        ...restOptions,
      },
    };
  },
};
