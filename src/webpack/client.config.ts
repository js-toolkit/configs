import type { Configuration, RuleSetRule, RuleSetUse } from 'webpack';
import type {} from 'webpack-dev-server';
import path from 'path';
import appEnv from '../appEnv';
import paths from '../paths';
import buildConfig from '../buildConfig';
import commonConfig, { type CommonConfigOptions } from './common.config';
import {
  TsLoaderType,
  assets,
  babelLoader,
  css,
  cssExtractLoader,
  cssNodeModules,
  getTsLoader,
} from './loaders';
import nodeRequire from './nodeRequire';
import { getInstalledPackage } from '../getInstalledPackage';

export const clientDefaultRules: Record<
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
    include: [paths.client.sources, paths.shared.sources].filter((v) => !!v),
    use: babelLoader(),
  },
  tsBaseRule: {
    test: /\.tsx?$/,
    include: [paths.client.sources, paths.shared.sources].filter((v) => !!v),
  },
  cssRule: {
    test: /\.css$/,
    include: [
      paths.client.sources,
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
    include: [paths.client.sources, paths.nodeModules.root],
    use: assets({ limit: undefined }),
  },
  fontRule: {
    test: /\.(eot|ttf|woff|woff2|otf)$/,
    include: [paths.client.assets, paths.nodeModules.root],
    use: assets(),
  },
  assetsRule: {
    test: /\.(png|jpg|gif|ico)$/,
    include: [paths.client.assets, paths.nodeModules.root],
    use: assets(),
  },
};

type DefaultRuleValue = RuleSetRule | ((defaults: RuleSetRule) => RuleSetRule);

type ClientDefaultRules = Record<
  Exclude<keyof typeof clientDefaultRules, 'tsBaseRule'>,
  DefaultRuleValue
> & { tsRule: (defaults: RuleSetRule) => RuleSetRule };

export interface ClientConfigOptions extends Omit<CommonConfigOptions, 'typescript'> {
  typescript?:
    | (CommonConfigOptions['typescript'] & {
        loaderOptions?: Record<string, any> | undefined;
        threadLoader?: boolean | undefined;
        threadLoaderOptions?: Record<string, any> | undefined;
      })
    | boolean
    | undefined;
  rules?: (Partial<ClientDefaultRules> & Record<string, RuleSetRule>) | undefined;
}

function containsLoader(rules: Record<string, RuleSetRule>, loader: string): boolean {
  const checkRule = (use?: RuleSetUse | undefined | null | string | false | 0): boolean => {
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
  html: typeof buildConfig.default.client.html
): Extract<typeof buildConfig.default.client.html, Array<any>> {
  return Array.isArray(html) ? html : [html];
}

const clientBuildConfig = buildConfig.client || buildConfig.default.client;

export default ({
  outputPath = paths.client.output.path,
  outputPublicPath = clientBuildConfig.output.publicPath,
  outputJsDir = clientBuildConfig.output.js,
  hash = true,
  chunkSuffix = '.chunk',
  typescript,
  rules: { tsBaseRule, ...rules } = {},
  ...restOptions
}: ClientConfigOptions): Configuration => {
  const tsConfig: RequiredStrict<Extract<ClientConfigOptions['typescript'], object>> = {
    configFile: paths.client.tsconfig,
    loader: TsLoaderType.Default,
    loaderOptions: {},
    forkedChecks: false,
    checkerOptions: {},
    threadLoader: false,
    threadLoaderOptions: {},
    ...(typeof typescript === 'object' && (typescript as RequiredStrict<typeof typescript>)),
  };

  const { tsBaseRule: defaultTsBaseRule, ...restDefaultRules } = clientDefaultRules;

  const defaultRules: Omit<typeof clientDefaultRules, 'tsBaseRule'> & { tsRule: RuleSetRule } = {
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

    name: clientBuildConfig.root,
    target: 'web',

    context: paths.client.sources,

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
      modules: [paths.client.sources, ...(restOptions.resolve?.modules || [])],
      alias: {
        // for universal projects
        ...(paths.shared.sources && { shared: paths.shared.sources }),
        ...(restOptions.resolve?.alias || undefined),
      },
      plugins: [
        ...(clientBuildConfig.webpackPnpEnabled ? [getPnpWebpackPlugin()] : []),
        ...(restOptions.resolve?.plugins || []),
      ],
    },

    resolveLoader: {
      ...restOptions.resolveLoader,
      plugins: [
        ...(clientBuildConfig.webpackPnpEnabled
          ? [getPnpWebpackPlugin().moduleLoader(module)]
          : []),
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
          const html = normalizeHtml(clientBuildConfig.html);
          const hasPug = html.some(({ template }) => template && template.endsWith('.pug'));
          return hasPug ? [{ test: /\.pug$/, use: { loader: 'pug-loader' } }] : [];
        })(),
        ...(restOptions.module?.rules || []),
      ],
    },

    plugins: [
      // Generate html if needed
      ...(() => {
        const html = normalizeHtml(clientBuildConfig.html);
        const getName = (): string => 'html-webpack-plugin';
        return html
          .filter((opts): opts is Required<typeof opts> => !!opts.template)
          .map(({ inject, template, ...rest }) => {
            const HtmlWebpackPlugin = nodeRequire(getName());
            return new HtmlWebpackPlugin({
              inject: inject ?? false,
              template: path.join(paths.client.sources, template),
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
          const { styles } = clientBuildConfig.output;
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
      //     const dir = clientBuildConfig.output.styles;
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
      clientBuildConfig.output.assetManifest.fileName &&
        (() => {
          const { fileName, filterTemplate } = clientBuildConfig.output.assetManifest;
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
                    (key) =>
                      !(key in item) ||
                      item[key] === filterTemplate[key as keyof typeof filterTemplate]
                  ),
          });
        })(),

      // Generate a service worker script that will precache, and keep up to date,
      // the HTML & assets that are part of the Webpack build.
      appEnv.prod &&
        clientBuildConfig.output.sw.swDest &&
        (() => {
          const getName = (): string => 'workbox-webpack-plugin';
          const { GenerateSW } = nodeRequire(getName());
          const html = normalizeHtml(clientBuildConfig.html);
          const filename =
            html.length === 1 ? html[0].filename : html.find(({ main }) => !!main)?.filename;
          return new GenerateSW({
            clientsClaim: true,
            importWorkboxFrom: 'cdn',
            exclude: [/\.map$/, new RegExp(`${clientBuildConfig.output.assetManifest.fileName}$`)],
            navigateFallback:
              filename && typeof filename === 'string'
                ? `${clientBuildConfig.output.publicPath}${filename}`
                : undefined,
            navigateFallbackBlacklist: [
              // Exclude URLs starting with /_, as they're likely an API call
              /^\/_/,
              // Exclude URLs containing a dot, as they're likely a resource in
              // public/ and not a SPA route
              /\/[^/]+\.[^/]+$/,
            ],
            ...clientBuildConfig.output.sw,
          });
        })(),

      // Copy public static content to output dir.
      // In dev mode them served by dev-server.
      appEnv.prod &&
        paths.client.staticContent.length > 0 &&
        (() => {
          // Exclude root and sources dirs
          const staticContent = paths.client.staticContent.filter((p) => {
            return p.path !== paths.client.root && p.path !== paths.client.sources;
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
      static: paths.client.staticContent.map(({ path: directory, ignore: ignored }) => ({
        directory,
        ...(ignored && { watch: { ignored } }),
      })),
      historyApiFallback: true, // For react subpages handling with webpack-dev-server
      host: '0.0.0.0',
      port: 9000,
      hot: 'only',
      ...restOptions.devServer,
      // dev: { publicPath: clientBuildConfig.output.publicPath },
    },
  });
};
