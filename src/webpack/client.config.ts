import { Configuration, RuleSetRule } from 'webpack';
import webpackMerge from 'webpack-merge';
import path from 'path';
import appEnv from '../appEnv';
import paths from '../paths';
import appConfig from '../appConfig';
import commonConfig, { CommonConfigOptions } from './common.config';
import loaders, { TsLoaderType } from './loaders';
import { mergeAndReplaceRules } from './utils';
import nodeRequire from './nodeRequire';

const cssExtractLoader = 'mini-css-extract-plugin/dist/loader';

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
    use: [appEnv.ifDevMode('style-loader', cssExtractLoader), ...loaders.css()],
  },
  cssNodeModulesRule: {
    test: /\.css$/,
    include: [paths.nodeModules.root],
    use: [appEnv.ifDevMode('style-loader', cssExtractLoader), ...loaders.cssNodeModules()],
  },
  assetsRule: {
    test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|otf)$/,
    include: [paths.client.assets, paths.nodeModules.root],
    use: loaders.assets(),
  },
};

export interface ClientConfigOptions
  extends Pick<Configuration, 'entry'>,
    Pick<
      CommonConfigOptions,
      Exclude<keyof CommonConfigOptions, 'outputPath' | 'outputPublicPath' | 'outputJsDir'>
    > {
  rules: Record<string, RuleSetRule>;
}

function containsLoader(rules: Record<string, RuleSetRule>, loader: string): boolean {
  return Object.getOwnPropertyNames(rules).some(key => {
    const rule = rules[key];
    return !!(
      (rule.loader && rule.loader.toString().includes(loader)) ||
      (rule.loaders && rule.loaders.toString().includes(loader)) ||
      (rule.use && rule.use.toString().includes(loader))
    );
  });
}

export default ({
  entry,
  rules,
  hash = true,
  useTypeScript,
  tsLoaderType = TsLoaderType.Default,
  tsconfig = paths.client.tsconfig,
}: ClientConfigOptions): Configuration => {
  const { tsBaseRule, ...restRules } = clientDefaultRules;

  const preparedRules = useTypeScript
    ? {
        tsRule: {
          ...tsBaseRule,
          use: loaders.getTsLoader({ loaderType: tsLoaderType, forkedChecks: true, tsconfig }),
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
      hash,
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
        rules: [
          ...Object.getOwnPropertyNames(moduleRules).map(name => moduleRules[name] || {}),
          // Provide pug loader if html template is pug template
          ...(appConfig.client.html.template && appConfig.client.html.template.endsWith('.pug')
            ? [{ test: /\.pug$/, use: { loader: 'pug-loader' } }]
            : []),
        ],
      },

      plugins: [
        // Generate html if needed
        ...(appConfig.client.html.template
          ? [
              (() => {
                const { template, ...rest } = appConfig.client.html;
                const getName = (): string => 'html-webpack-plugin';
                const HtmlWebpackPlugin = nodeRequire(getName());
                return new HtmlWebpackPlugin({
                  inject: false,
                  template: path.join(paths.client.sources, template),
                  ...rest,
                });
              })(),
            ]
          : []),

        // Extract css in production only if has mini-css-extract-plugin loader
        ...(appEnv.prod && containsLoader(moduleRules, cssExtractLoader)
          ? [
              (() => {
                const getName = (): string => 'mini-css-extract-plugin';
                const MiniCssExtractPlugin = nodeRequire(getName());
                return new MiniCssExtractPlugin({
                  filename: `${appConfig.client.output.styles}/[name].css?[contenthash:5]`,
                });
              })(),
            ]
          : []),

        // Generate asset manifest for some tools
        ...(appConfig.client.output.assetManifest.fileName
          ? [
              (() => {
                const { fileName, filterTemplate } = appConfig.client.output.assetManifest;
                const isNeedFilter =
                  !!filterTemplate && !!Object.getOwnPropertyNames(filterTemplate).length;

                const getName = (): string => 'webpack-manifest-plugin';
                const WebpackManifestPlugin = nodeRequire(getName());
                return new WebpackManifestPlugin({
                  fileName,
                  filter: !isNeedFilter
                    ? undefined
                    : (item: {}) =>
                        Object.getOwnPropertyNames(filterTemplate).every(
                          key => !(key in item) || item[key] === filterTemplate[key]
                        ),
                });
              })(),
            ]
          : []),
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
