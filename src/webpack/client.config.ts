import { Configuration, RuleSetRule, RuleSetUse } from 'webpack';
import webpackMerge from 'webpack-merge';
import path from 'path';
import appEnv from '../appEnv';
import paths from '../paths';
import appConfig from '../appConfig';
import commonConfig, { CommonConfigOptions } from './common.config';
import loaders, { TsLoaderType } from './loaders';
import { mergeAndReplaceRules } from './utils';
import nodeRequire from './nodeRequire';

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
    include: [
      paths.client.sources,
      // because this packages are require css-modules
      path.join(paths.nodeModules.root, '@vzh/react-components'),
      path.join(paths.nodeModules.root, 'reflexy'),
    ],
    use: loaders.css(),
  },
  cssNodeModulesRule: {
    test: /\.css$/,
    include: [paths.nodeModules.root],
    // because this packages included in cssRule
    exclude: [
      path.join(paths.nodeModules.root, '@vzh/react-components'),
      path.join(paths.nodeModules.root, 'reflexy'),
    ],
    use: loaders.cssNodeModules(),
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
  const checkRule = (use?: RuleSetUse): boolean => {
    if (typeof use === 'string') return use.includes(loader);
    if (Array.isArray(use)) return use.some(checkRule);
    if (typeof use !== 'function' && use && use.loader) return use.loader.includes(loader);
    return false;
  };

  return Object.getOwnPropertyNames(rules).some(key => {
    const rule = rules[key];
    return checkRule(rule.loader || rule.loaders || rule.use);
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
        appConfig.client.html.template &&
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

        // Extract css in production only if has mini-css-extract-plugin loader
        appEnv.prod &&
          containsLoader(moduleRules, loaders.cssExtractLoader) &&
          (() => {
            const getName = (): string => 'mini-css-extract-plugin';
            const MiniCssExtractPlugin = nodeRequire(getName());
            const hashStr = appEnv.prod && hash ? '.[contenthash:8]' : '';
            return new MiniCssExtractPlugin({
              filename: `${appConfig.client.output.styles}/[name]${hashStr}.css`,
              chunkFilename: `${appConfig.client.output.styles}/[name]${hashStr}.chunk.css`,
            });
          })(),

        // Generate a manifest file which contains a mapping of all asset filenames
        // to their corresponding output file so some tools can pick it up without
        // having to parse `index.html`.
        appConfig.client.output.assetManifest.fileName &&
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

        // Generate a service worker script that will precache, and keep up to date,
        // the HTML & assets that are part of the Webpack build.
        appEnv.prod &&
          appConfig.client.output.sw.swDest &&
          (() => {
            const getName = (): string => 'workbox-webpack-plugin';
            const { GenerateSW } = nodeRequire(getName());
            return new GenerateSW({
              clientsClaim: true,
              importWorkboxFrom: 'cdn',
              exclude: [/\.map$/, new RegExp(`${appConfig.client.output.assetManifest.fileName}$`)],
              navigateFallback: `${appConfig.client.output.publicPath}${appConfig.client.html.filename}`,
              navigateFallbackBlacklist: [
                // Exclude URLs starting with /_, as they're likely an API call
                new RegExp('^/_'),
                // Exclude URLs containing a dot, as they're likely a resource in
                // public/ and not a SPA route
                new RegExp('/[^/]+\\.[^/]+$'),
              ],
              ...appConfig.client.output.sw,
            });
          })(),
      ].filter(Boolean),

      // Some libraries import Node modules but don't use them in the browser.
      // Tell Webpack to provide empty mocks for them so importing them works.
      node: {
        module: 'empty',
        dgram: 'empty',
        dns: 'mock',
        fs: 'empty',
        http2: 'empty',
        net: 'empty',
        tls: 'empty',
        // eslint-disable-next-line @typescript-eslint/camelcase
        child_process: 'empty',
      },

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
