import { Configuration, RuleSetRule, RuleSetUse } from 'webpack';
import path from 'path';
import appEnv from '../appEnv';
import paths from '../paths';
import apprc from '../apprc';
import commonConfig, { CommonConfigOptions } from './common.config';
import loaders, { TsLoaderType } from './loaders';
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
      // Because this packages are require css-modules.
      // And to avoid duplicating css classes when composes process in the same loaders.
      path.join(paths.nodeModules.root, '@vzh/react-components'),
      path.join(paths.nodeModules.root, '@vzh/editors'),
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
      path.join(paths.nodeModules.root, '@vzh/editors'),
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

export interface ClientConfigOptions extends CommonConfigOptions {
  tsLoaderOptions?: {};
  useTsThreadLoader?: boolean;
  tsThreadLoaderOptions?: {};
  rules?: Record<string, RuleSetRule>;
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
  outputPath = paths.client.output.path,
  outputPublicPath = apprc.client.output.publicPath,
  outputJsDir = apprc.client.output.js,
  hash = true,
  useTypeScript,
  tsLoaderType = TsLoaderType.Default,
  tsconfig = paths.client.tsconfig,
  useTsForkedChecks = false,
  useTsThreadLoader = false,
  tsLoaderOptions = {},
  tsCheckerOptions = {},
  tsThreadLoaderOptions = {},
  entry,
  rules: { tsBaseRule, ...rules } = {},
  ...restOptions
}: ClientConfigOptions): Configuration => {
  const { tsBaseRule: defaultTsBaseRule, ...restRules } = clientDefaultRules;

  const preparedRules = useTypeScript
    ? {
        tsRule: {
          ...defaultTsBaseRule,
          ...tsBaseRule,
          use: loaders.getTsLoader({
            tsconfig,
            forkedChecks: useTsForkedChecks,
            useThreadLoader: useTsThreadLoader,
            threadLoaderOptions: tsThreadLoaderOptions,
            ...tsLoaderOptions,
            loaderType: tsLoaderType,
          }),
        },
        ...restRules,
      }
    : { ...restRules };

  const moduleRules = { ...preparedRules, ...rules };

  return commonConfig({
    outputPath,
    outputPublicPath,
    outputJsDir,
    hash,
    useTypeScript,
    tsLoaderType,
    tsconfig,
    useTsForkedChecks,
    tsCheckerOptions: {
      checkSyntacticErrors: useTsThreadLoader, // ts-loader in happyPackMode will not check SyntacticErrors so let check it in this plugin
      ...tsCheckerOptions,
    },

    name: apprc.client.root,
    target: 'web',

    context: paths.client.sources,

    entry,

    // recordsOutputPath: path.join(paths.output.path, 'webpack.client.stats.json'),

    ...restOptions,

    resolve: {
      ...restOptions.resolve,
      modules: [
        paths.client.sources,
        ...((restOptions.resolve && restOptions.resolve.modules) || []),
      ],
      alias: {
        // for universal projects
        shared: paths.shared.sources,
        ...((restOptions.resolve && restOptions.resolve.alias) || undefined),
      },
    },

    module: {
      ...restOptions.module,
      rules: [
        ...Object.getOwnPropertyNames(moduleRules).map(name => moduleRules[name] || {}),
        // Provide pug loader if html template is pug template
        ...(apprc.client.html.template && apprc.client.html.template.endsWith('.pug')
          ? [{ test: /\.pug$/, use: { loader: 'pug-loader' } }]
          : []),
        ...((restOptions.module && restOptions.module.rules) || []),
      ],
    },

    plugins: [
      // Generate html if needed
      apprc.client.html.template &&
        (() => {
          const { template, ...rest } = apprc.client.html;
          const getName = (): string => 'html-webpack-plugin';
          const HtmlWebpackPlugin = nodeRequire(getName());
          return new HtmlWebpackPlugin({
            inject: false,
            template: path.join(paths.client.sources, template),
            ...rest,
          });
        })(),

      // Extract css if has mini-css-extract-plugin loader
      containsLoader(moduleRules, loaders.cssExtractLoader) &&
        (() => {
          const getName = (): string => 'mini-css-extract-plugin';
          const MiniCssExtractPlugin = nodeRequire(getName());
          const hashStr = hash ? '.[contenthash:8]' : '';
          return new MiniCssExtractPlugin({
            filename: `${apprc.client.output.styles}/[name]${hashStr}.css`,
            chunkFilename: `${apprc.client.output.styles}/[name]${hashStr}.chunk.css`,
          });
        })(),

      // Generate a manifest file which contains a mapping of all asset filenames
      // to their corresponding output file so some tools can pick it up without
      // having to parse `index.html`.
      apprc.client.output.assetManifest.fileName &&
        (() => {
          const { fileName, filterTemplate } = apprc.client.output.assetManifest;
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
        apprc.client.output.sw.swDest &&
        (() => {
          const getName = (): string => 'workbox-webpack-plugin';
          const { GenerateSW } = nodeRequire(getName());
          return new GenerateSW({
            clientsClaim: true,
            importWorkboxFrom: 'cdn',
            exclude: [/\.map$/, new RegExp(`${apprc.client.output.assetManifest.fileName}$`)],
            navigateFallback: `${apprc.client.output.publicPath}${apprc.client.html.filename}`,
            navigateFallbackBlacklist: [
              // Exclude URLs starting with /_, as they're likely an API call
              new RegExp('^/_'),
              // Exclude URLs containing a dot, as they're likely a resource in
              // public/ and not a SPA route
              new RegExp('/[^/]+\\.[^/]+$'),
            ],
            ...apprc.client.output.sw,
          });
        })(),

      ...(restOptions.plugins || []),
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
      ...restOptions.node,
    },

    devServer: {
      contentBase: paths.client.staticContent, // Static content which not processed by webpack and loadable from disk.
      publicPath: apprc.client.output.publicPath,
      historyApiFallback: true, // For react subpages handling with webpack-dev-server
      host: '0.0.0.0',
      port: 9000,
      hotOnly: true,
      noInfo: false,
      stats: 'minimal',
      ...restOptions.devServer,
    },
  });
};
