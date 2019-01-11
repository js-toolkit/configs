import { Configuration, RuleSetRule } from 'webpack';
import webpackMerge from 'webpack-merge';
import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import WebpackManifestPlugin from 'webpack-manifest-plugin';
import appEnv from '../appEnv';
import paths from '../paths';
import appConfig from '../appConfig';
import commonConfig, { CommonConfigOptions } from './common.config';
import loaders, { BaseTsOptions, TsLoaderType, GetTsLoaderOptions } from './loaders';
import { mergeAndReplaceRules } from './utils';

export const clientDefaultRules: Record<
  'jsRule' | 'tsBaseRule' | 'cssRule' | 'cssNodeModulesRule' | 'assetsRule',
  RuleSetRule
> = {
  jsRule: {
    test: /\.jsx?$/,
    include: [paths.client.sources, paths.shared.sources],
    use: loaders.babel(),
  },
  tsBaseRule: {
    test: /\.tsx?$/,
    include: [paths.client.sources, paths.shared.sources],
  },
  cssRule: {
    test: /\.css$/,
    include: [paths.client.sources],
    use: [appEnv.ifDevMode('style-loader', MiniCssExtractPlugin.loader), ...loaders.css()],
  },
  cssNodeModulesRule: {
    test: /\.css$/,
    include: [paths.nodeModules.root],
    use: [
      appEnv.ifDevMode('style-loader', MiniCssExtractPlugin.loader),
      ...loaders.cssNodeModules(),
    ],
  },
  assetsRule: {
    test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|otf)$/,
    include: [paths.client.assets, paths.nodeModules.root],
    use: loaders.assets(),
  },
};

export interface ClientConfigOptions
  extends Pick<Configuration, 'entry'>,
    Pick<CommonConfigOptions, 'useTypeScript' | 'tsLoaderType'>,
    Partial<BaseTsOptions> {
  rules: Record<string, RuleSetRule>;
}

export default ({
  entry,
  rules,
  useTypeScript,
  tsLoaderType = TsLoaderType.Default,
  tsconfig = paths.client.tsconfig,
}: ClientConfigOptions): Configuration => {
  const { tsBaseRule, ...restRules } = clientDefaultRules;

  const preparedRules = useTypeScript
    ? {
        tsRule: {
          ...tsBaseRule,
          use: loaders.getTsLoader({
            loaderType: tsLoaderType,
            forkedChecks: true,
            tsconfig,
          } as GetTsLoaderOptions),
        },
        ...restRules,
      }
    : { ...restRules };

  const moduleRules = mergeAndReplaceRules(preparedRules, rules);

  return webpackMerge(
    commonConfig({
      outputPath: paths.client.output.path,
      outputPublicPath: appConfig.client.output.publicPath,
      outputJsDir: appConfig.client.output.js,
      hash: true,
      useTypeScript,
      tsLoaderType,
      tsconfig,
    }),
    {
      name: appConfig.client.root,
      target: 'web',

      context: paths.client.sources,

      entry,

      resolve: {
        modules: [paths.client.sources],
        alias: {
          // for universal projects
          shared: paths.shared.sources,
        },
      },

      // recordsOutputPath: path.join(paths.output.path, 'webpack.client.stats.json'),

      module: {
        rules: Object.getOwnPropertyNames(moduleRules).map(name => moduleRules[name] || {}),
      },

      plugins: [
        // Generate html if needed
        ...(appConfig.client.html.template
          ? [
              (() => {
                const getName = () => 'html-webpack-plugin';
                const { template, ...rest } = appConfig.client.html;

                return new (require(getName()))({
                  inject: false,
                  template: path.join(paths.client.sources, template),
                  ...rest,
                });
              })(),
            ]
          : []),

        // Extract css in production
        ...appEnv.ifProdMode(
          [
            new MiniCssExtractPlugin({
              filename: `${appConfig.client.output.styles}/[name].css?[contenthash:5]`,
            }),
          ],
          []
        ),
        // Generate asset manifest for some tools
        new WebpackManifestPlugin({
          fileName: appConfig.client.output.assetManifest.fileName,
          filter: (() => {
            const template = appConfig.client.output.assetManifest.filterTemplate;
            if (!template) return undefined;
            const keys = Object.getOwnPropertyNames(template);
            if (!keys.length) return undefined;
            return (item: WebpackManifestPlugin.FileDescriptor) =>
              keys.every(key => !(key in item) || item[key] === template[key]);
          })(),
        }),
      ],

      devServer: {
        contentBase: paths.client.staticContent, // Static content which not processed by webpack and loadable from disk.
        publicPath: appConfig.client.output.publicPath,
        historyApiFallback: true, // For react subpages handling with webpack-dev-server
        host: '0.0.0.0',
        port: 9000,
        hotOnly: true,
        noInfo: false,
        stats: 'minimal',
      },
    }
  );
};
