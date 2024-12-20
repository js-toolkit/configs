import type { Configuration, RuleSetRule, RuleSetUse } from 'webpack';
import type {} from 'webpack-dev-server';
import path from 'path';
import appEnv from '../appEnv';
import paths from '../paths';
import buildConfig from '../buildConfig';
import commonConfig, { type CommonConfigOptions } from './common.config';
import {
  TsLoaderType,
  babelLoader,
  css,
  cssExtractLoader,
  cssNodeModules,
  getTsLoader,
} from './loaders';
import nodeRequire from './nodeRequire';
import { getInstalledPackage } from '../getInstalledPackage';
import type { RequiredStrict } from './types';

// https://webpack.js.org/guides/asset-modules/

export const webDefaultRules: Record<
  | 'jsRule'
  | 'tsBaseRule'
  | 'cssRule'
  | 'cssNodeModulesRule'
  | 'svgRule'
  | 'fontRule'
  | 'assetsRule',
  RuleSetRule
> = {
  jsRule: {
    test: /\.m?jsx?$/,
    include: [paths.web.sources, paths.shared.sources].filter((v) => !!v),
    use: babelLoader(),
  },
  tsBaseRule: {
    test: /\.tsx?$/,
    include: [paths.web.sources, paths.shared.sources].filter((v) => !!v),
  },
  cssRule: {
    test: /\.css$/,
    include: [
      paths.web.sources,
      // Because this packages are require css-modules.
      // And to avoid duplicating css classes when composes process in the same loaders.
      path.join(paths.nodeModules.root, '@jstoolkit/react-components'),
      path.join(paths.nodeModules.root, '@jstoolkit/editors'),
      path.join(paths.nodeModules.root, '@js-toolkit/react-components'),
      path.join(paths.nodeModules.root, '@js-toolkit/editors'),
      path.join(paths.nodeModules.root, 'reflexy'),
    ],
    use: css({ extractor: !appEnv.dev }),
  },
  cssNodeModulesRule: {
    test: /\.css$/,
    include: [paths.nodeModules.root],
    // because this packages included in cssRule
    exclude: [
      path.join(paths.nodeModules.root, '@jstoolkit/react-components'),
      path.join(paths.nodeModules.root, '@jstoolkit/editors'),
      path.join(paths.nodeModules.root, '@js-toolkit/react-components'),
      path.join(paths.nodeModules.root, '@js-toolkit/editors'),
      path.join(paths.nodeModules.root, 'reflexy'),
    ],
    use: cssNodeModules({ extractor: !appEnv.dev }),
  },
  svgRule: {
    test: /\.svg$/,
    include: [paths.web.sources, paths.nodeModules.root],
    type: 'asset/inline',
  },
  fontRule: {
    test: /\.(eot|ttf|woff|woff2|otf)$/,
    include: [paths.web.assets, paths.nodeModules.root],
    type: 'asset',
    parser: {
      dataUrlCondition: { maxSize: 4 * 1024 }, // 4kb
    },
    generator: {
      filename: `${
        (buildConfig.web || buildConfig.default.web).output.assets
      }/[name].[hash:8].[ext][query]`, // Virtual hash useful for HRM during development.
    },
  },
  assetsRule: {
    test: /\.(png|jpg|gif|ico)$/,
    include: [paths.web.assets, paths.nodeModules.root],
    type: 'asset',
    parser: {
      dataUrlCondition: { maxSize: 8 * 1024 }, // 8kb
    },
    generator: {
      filename: `${
        (buildConfig.web || buildConfig.default.web).output.assets
      }/[name].[hash:8].[ext][query]`, // Virtual hash useful for HRM during development.
    },
  },
};

type DefaultRuleValue = RuleSetRule | ((defaults: RuleSetRule) => RuleSetRule);

type WebDefaultRules = Record<
  Exclude<keyof typeof webDefaultRules, 'tsBaseRule'>,
  DefaultRuleValue
> & { tsRule: (defaults: RuleSetRule) => RuleSetRule };

export interface WebConfigOptions extends Omit<CommonConfigOptions, 'typescript'> {
  typescript?:
    | (CommonConfigOptions['typescript'] & {
        loaderOptions?: Record<string, any> | undefined;
        threadLoader?: boolean | undefined;
        threadLoaderOptions?: Record<string, any> | undefined;
      })
    | boolean
    | undefined;
  rules?: (Partial<WebDefaultRules> & Record<string, RuleSetRule>) | undefined;
}

function containsLoader(rules: Record<string, RuleSetRule>, loader: string): boolean {
  const checkRule = (use?: RuleSetUse | null | string | false | 0): boolean => {
    if (typeof use === 'string') return use.includes(loader);
    if (Array.isArray(use)) return use.some(checkRule);
    if (typeof use !== 'function' && use && use.loader) return use.loader.includes(loader);
    return false;
  };

  return Object.getOwnPropertyNames(rules).some((key) => {
    const rule = rules[key];
    return rule && checkRule(rule.loader || rule.use);
  });
}

export function prepareRules(
  rules: Record<string, DefaultRuleValue>,
  defaultRules: Record<string, RuleSetRule>
): Record<string, RuleSetRule> {
  return Object.entries<DefaultRuleValue>(rules).reduce((acc, [key, value]) => {
    if (typeof value === 'function' && key in defaultRules && defaultRules[key]) {
      acc[key] = value(defaultRules[key]);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as AnyObject);
}

function getPnpWebpackPlugin(): any {
  const getName = (): string => 'pnp-webpack-plugin';
  return nodeRequire(getName());
}

function normalizeHtml(
  html: typeof buildConfig.default.web.html
): Extract<typeof buildConfig.default.web.html, Array<any>> {
  return Array.isArray(html) ? html : [html];
}

const webBuildConfig = buildConfig.web || buildConfig.default.web;

export default ({
  outputPath = paths.web.output.path,
  outputPublicPath = webBuildConfig.output.publicPath,
  outputJsDir = webBuildConfig.output.js,
  hash = true,
  chunkSuffix = '.chunk',
  typescript,
  rules: { tsBaseRule, ...rules } = {},
  ...restOptions
}: WebConfigOptions): Configuration => {
  const tsConfig: RequiredStrict<Extract<WebConfigOptions['typescript'], object>> = {
    configFile: paths.web.tsconfig,
    loader: TsLoaderType.Default,
    loaderOptions: {},
    forkedChecks: false,
    checkerOptions: {},
    threadLoader: false,
    threadLoaderOptions: {},
    ...(typeof typescript === 'object' && (typescript as RequiredStrict<typeof typescript>)),
  };

  const { tsBaseRule: defaultTsBaseRule, ...restDefaultRules } = webDefaultRules;

  const defaultRules: Omit<typeof webDefaultRules, 'tsBaseRule'> & { tsRule: RuleSetRule } = {
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

    name: webBuildConfig.root,
    target: 'web',

    context: paths.web.sources,

    // recordsOutputPath: path.join(paths.output.path, 'webpack.client.stats.json'),

    stats: appEnv.ifDev('minimal', undefined),

    ...restOptions,

    optimization: {
      ...restOptions.optimization,
      ...appEnv.ifProd(
        {
          minimizer: [
            getInstalledPackage('css-minimizer-webpack-plugin') &&
              (() => {
                const getName = (): string => 'css-minimizer-webpack-plugin';
                const CssMinimizerPlugin = nodeRequire(getName());
                return new CssMinimizerPlugin({
                  minimizerOptions: { preset: 'default' },
                });
              })(),
            ...(restOptions.optimization?.minimizer || []),
          ],
        },
        undefined
      ),
    },

    resolve: {
      ...restOptions.resolve,
      modules: [paths.web.sources, ...(restOptions.resolve?.modules || [])],
      alias: {
        // for universal projects
        ...(paths.shared.sources && { shared: paths.shared.sources }),
        ...(restOptions.resolve?.alias || undefined),
      },
      plugins: [
        ...(webBuildConfig.webpackPnpEnabled ? [getPnpWebpackPlugin()] : []),
        ...(restOptions.resolve?.plugins || []),
      ],
    },

    resolveLoader: {
      ...restOptions.resolveLoader,
      plugins: [
        ...(webBuildConfig.webpackPnpEnabled ? [getPnpWebpackPlugin().moduleLoader(module)] : []),
        ...(restOptions.resolveLoader?.plugins || []),
      ],
    },

    module: {
      ...restOptions.module,
      rules: [
        ...Object.getOwnPropertyNames(moduleRules).map(
          (name) => moduleRules[name as keyof typeof moduleRules] || {}
        ),
        // Provide pug loader if html template is pug template
        ...(() => {
          const html = normalizeHtml(webBuildConfig.html);
          const hasPug = html.some(({ template }) => template && template.endsWith('.pug'));
          return hasPug ? [{ test: /\.pug$/, use: { loader: 'pug-loader' } }] : [];
        })(),
        ...(restOptions.module?.rules || []),
      ],
    },

    plugins: [
      // Generate html if needed
      ...(() => {
        const html = normalizeHtml(webBuildConfig.html);
        const getName = (): string => 'html-webpack-plugin';
        return html
          .filter((opts): opts is Required<typeof opts> => !!opts.template)
          .map(({ inject, template, ...rest }) => {
            const HtmlWebpackPlugin = nodeRequire(getName());
            return new HtmlWebpackPlugin({
              inject: inject ?? false,
              template: path.join(paths.web.sources, template),
              ...rest,
            });
          });
      })(),

      // Extract css if has corresponding loader
      containsLoader(moduleRules, cssExtractLoader) &&
        (() => {
          const getName = (): string => 'mini-css-extract-plugin';
          const MiniCssExtractPlugin = nodeRequire(getName());
          const entryHash = hash === true || (typeof hash === 'object' && hash.entry);
          const chunkHash = hash === true || (typeof hash === 'object' && hash.chunk);
          const entryHashStr = appEnv.prod && entryHash ? '.[contenthash:8]' : '';
          const chunkHashStr = appEnv.prod && chunkHash ? '.[contenthash:8]' : '';
          const { styles } = webBuildConfig.output;
          const dir = (typeof styles === 'string' ? styles : styles?.dir) || '.';
          return new MiniCssExtractPlugin({
            filename: `${dir}/[name]${entryHashStr}.css`,
            chunkFilename: `${dir}/[name]${chunkHashStr}${chunkSuffix ?? ''}.css`,
            ...(typeof styles === 'object' && styles),
          });
        })(),
      // Obsolete
      // containsLoader(moduleRules, cssExtractLoader) &&
      //   (() => {
      //     const getName = (): string => 'extract-css-chunks-webpack-plugin';
      //     const ExtractCssPlugin = nodeRequire(getName());
      //     const entryHash = hash === true || (typeof hash === 'object' && hash.entry);
      //     const chunkHash = hash === true || (typeof hash === 'object' && hash.chunk);
      //     const entryHashStr = appEnv.prod && entryHash ? '.[contenthash:8]' : '';
      //     const chunkHashStr = appEnv.prod && chunkHash ? '.[contenthash:8]' : '';
      //     const dir = webBuildConfig.output.styles;
      //     return new ExtractCssPlugin({
      //       filename: `${dir}/[name]${entryHashStr}.css`,
      //       chunkFilename: `${dir}/[name]${chunkHashStr}${chunkSuffix ?? ''}.css`,
      //     });
      //   })(),
      // Obsolete
      // Minimize css
      // (restOptions.optimization?.minimize ?? true) &&
      //   containsLoader(moduleRules, cssExtractLoader) &&
      //   (() => {
      //     const getName = (): string => 'optimize-css-assets-webpack-plugin';
      //     const OptimizeCssAssetsPlugin = nodeRequire(getName());
      //     return new OptimizeCssAssetsPlugin({
      //       cssProcessorPluginOptions: {
      //         preset: ['default', { discardComments: { removeAll: true } }],
      //       },
      //     });
      //   })(),

      // Generate a manifest file which contains a mapping of all asset filenames
      // to their corresponding output file so some tools can pick it up without
      // having to parse `index.html`.
      webBuildConfig.output.assetManifest.fileName &&
        (() => {
          const { fileName, filterTemplate } = webBuildConfig.output.assetManifest;
          const isNeedFilter =
            !!filterTemplate && !!Object.getOwnPropertyNames(filterTemplate).length;

          const getName = (): string => 'webpack-manifest-plugin';
          const WebpackManifestPlugin = nodeRequire(getName());
          return new WebpackManifestPlugin({
            fileName,
            filter: !isNeedFilter
              ? undefined
              : (item: Record<string, any>) =>
                  Object.getOwnPropertyNames(filterTemplate).every(
                    (key) => !(key in item) || item[key] === filterTemplate[key]
                  ),
          });
        })(),

      // Generate a service worker script that will precache, and keep up to date,
      // the HTML & assets that are part of the Webpack build.
      (webBuildConfig.output.sw.swDest || webBuildConfig.output.sw.swSrc) &&
        (() => {
          const getName = (): string => 'workbox-webpack-plugin';
          const { GenerateSW, InjectManifest } = nodeRequire(getName());
          // const html = normalizeHtml(webBuildConfig.html);
          // const filename =
          //   html.length === 1 ? html[0].filename : html.find(({ main }) => !!main)?.filename;
          const exclude = [
            /\.map$/,
            /^manifest.*\.js$/,
            webBuildConfig.output.assetManifest.fileName &&
              new RegExp(`${webBuildConfig.output.assetManifest.fileName}$`),
          ].filter(Boolean);

          const { swSrc, swDest, ...rest } = webBuildConfig.output.sw;

          if (swSrc) {
            return new InjectManifest({
              swSrc,
              ...(swDest && { swDest }),
              exclude,
              ...rest,
            });
          }

          return new GenerateSW({
            ...(swDest && { swDest }),
            clientsClaim: true,
            exclude,
            // navigateFallback:
            //   filename && typeof filename === 'string'
            //     ? `${webBuildConfig.output.publicPath}${filename}`
            //     : undefined,
            // navigateFallbackBlacklist: [
            //   // Exclude URLs starting with /_, as they're likely an API call
            //   /^\/_/,
            //   // Exclude URLs containing a dot, as they're likely a resource in
            //   // public/ and not a SPA route
            //   /\/[^/]+\.[^/]+$/,
            // ],
            ...rest,
          });
        })(),

      // Copy public static content to output dir.
      // In dev mode them served by dev-server.
      appEnv.prod &&
        paths.web.staticContent.length > 0 &&
        (() => {
          // Exclude root and sources dirs
          const staticContent = paths.web.staticContent.filter((p) => {
            return p.path !== paths.web.root && p.path !== paths.web.sources;
          });
          if (staticContent.length === 0) {
            return undefined;
          }
          const getName = (): string => 'copy-webpack-plugin';
          const CopyPlugin = nodeRequire(getName());
          return new CopyPlugin({
            patterns: staticContent.map(({ path: from, ignore, ...rest }) => ({
              from,
              ...(ignore && { globOptions: { ignore } }),
              ...rest,
            })),
          });
        })(),

      ...(restOptions.plugins || []),
    ].filter(Boolean),

    devServer: {
      // Static content which not processed by webpack and loadable from disk.
      static: paths.web.staticContent.map(({ path: directory, ignore: ignored }) => ({
        directory,
        ...(ignored && { watch: { ignored } }),
      })),
      historyApiFallback: true, // For react subpages handling with webpack-dev-server
      host: '0.0.0.0',
      port: 9000,
      hot: 'only',
      ...restOptions.devServer,
      // dev: { publicPath: webBuildConfig.output.publicPath },
    },
  });
};
