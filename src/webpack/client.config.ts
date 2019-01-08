import webpack, { Configuration, RuleSetRule } from 'webpack';
import webpackMerge from 'webpack-merge';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import appEnv from '../appEnv';
import paths, { dirMap } from '../paths';
import commonConfig, { CommonConfigOptions } from './common.config';
import loaders, {
  BaseTsOptions,
  TsLoaderType,
  GetTsCheckerPluginOptions,
  GetTsLoaderOptions,
} from './loaders';
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

// export type DefaultClientJsRules = typeof defaultRules;

export interface ClientConfigOptions
  extends Pick<Configuration, 'entry'>,
    Pick<CommonConfigOptions, 'useTypeScript'>,
    Partial<BaseTsOptions> {
  rules: Record<string, RuleSetRule>;
  tsLoaderType?: TsLoaderType;
}

export default ({
  entry,
  rules,
  useTypeScript,
  tsLoaderType = TsLoaderType.Default,
  tsconfig = paths.client.tsconfig,
}: ClientConfigOptions): Configuration => {
  const { tsBaseRule, ...rest } = clientDefaultRules;

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
        ...rest,
      }
    : { ...rest };

  const moduleRules = mergeAndReplaceRules(preparedRules, rules);

  return webpackMerge(
    commonConfig({
      outputPath: paths.client.output.path,
      outputPublicPath: dirMap.client.output.publicPath,
      outputJsDir: dirMap.client.output.js,
      hash: true,
      useTypeScript,
      tsconfig,
    }),
    {
      name: dirMap.client.root,
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
        ...appEnv.ifDevMode(
          [
            // Enable HMR in development.
            new webpack.HotModuleReplacementPlugin(),
          ],
          [
            new MiniCssExtractPlugin({
              filename: `${dirMap.client.output.styles}/[name].css?[contenthash:5]`,
            }),
          ]
        ),
        ...(useTypeScript
          ? [
              loaders.getTsCheckerPlugin({
                loaderType: tsLoaderType,
                tsconfig,
              } as GetTsCheckerPluginOptions),
            ]
          : []),
      ],

      devServer: {
        contentBase: paths.client.staticContent, // Static content which not processed by webpack and loadable from disk.
        publicPath: dirMap.client.output.publicPath,
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
