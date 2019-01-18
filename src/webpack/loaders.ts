import { Loader } from 'webpack';
import { Omit } from '@vzh/ts-types';
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

interface GetTsATLOptions extends GetTsLoaderOptionsBase {
  loaderType: TsLoaderType.ATL;
}

interface GetTsBabelLoaderOptions extends GetTsLoaderOptionsBase, Record<PropertyKey, any> {
  loaderType: TsLoaderType.Babel;
}

export type GetTsLoaderOptions =
  | GetTsDefaultLoaderOptions
  | GetTsATLOptions
  | GetTsBabelLoaderOptions;

export type GetTsCheckerPluginOptions =
  | { loaderType: TsLoaderType.ATL }
  | ({ loaderType: TsLoaderType.Default } & BaseTsOptions);

export default {
  getTsLoader({ loaderType, ...rest }: GetTsLoaderOptions & Record<string, any>) {
    if (loaderType === TsLoaderType.ATL) return this.atl(rest);
    if (loaderType === TsLoaderType.Babel) return this.babel(rest);
    return this.ts({ ...rest });
  },

  getTsCheckerPlugin({ loaderType, ...rest }: GetTsCheckerPluginOptions & Record<string, any>) {
    if (loaderType === TsLoaderType.ATL) return this.atlCheckerPlugin();
    return this.tsCheckerPlugin(rest as BaseTsOptions);
  },

  ts({
    tsconfig,
    forkedChecks,
    afterLoaders,
    ...rest
  }: Omit<GetTsDefaultLoaderOptions, 'loaderType'> & Record<string, any>) {
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
        },
      },
    ];
  },

  tsRHL({
    tsconfig,
    forkedChecks,
    afterLoaders,
    ...rest
  }: Omit<GetTsDefaultLoaderOptions, 'loaderType'> & Record<string, any>) {
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
    const getName = () => 'fork-ts-checker-webpack-plugin';
    const Plugin = nodeRequire(getName());
    return new Plugin({
      tsconfig,
      compilerOptions: {
        module: 'esnext',
        moduleResolution: 'node',
        resolveJsonModule: true,
        isolatedModules: true,
        // async: false,
        noEmit: true,
        jsx: 'preserve',
      },
      checkSyntacticErrors: appEnv.prod,
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
    const getName = () => 'awesome-typescript-loader';
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
    ...rest
  }: {
    ssr?: boolean;
    pattern?: string;
    prodPattern?: string;
    postcss?: boolean;
  } & Record<string, any> = {}) {
    return [
      {
        loader: 'css-loader',
        options: {
          modules: true,
          localIdentName: appEnv.ifDevMode(pattern, prodPattern),
          context: paths.root, // https://github.com/webpack-contrib/css-loader/issues/267
          importLoaders: postcss ? 1 : undefined,
          sourceMap: appEnv.dev,
          exportOnlyLocals: ssr,
          ...rest,
        },
      },
      ...(postcss ? ['postcss-loader'] : []),
    ];
  },

  cssNodeModules({ ssr = false, postcss = false, ...rest } = {}) {
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

  assets({ ssr = false } = {}) {
    return {
      // Embeds resources as DataUrl, or if the file size exceeds options.limit then redirects
      // to the file-loader with all specified parameters and it copies the files.
      loader: 'url-loader',
      options: {
        limit: 1024,
        fallback: 'file-loader',
        emitFile: !ssr,
        name: `${appConfig.client.output.assets}/[name].[ext]?[hash:base64:5]`, // Virtual hash for HRM during development.
      },
    };
  },
};
