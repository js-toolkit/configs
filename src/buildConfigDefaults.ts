/* eslint-disable @typescript-eslint/explicit-function-return-type */

import type { AnyObject } from './types';

// todo: Сделать типы web, node, common и только один тип для файла конфигурации?

export function getWebAppConfig(root = 'web') {
  type HtmlOptions = import('html-webpack-plugin').Options & {
    readonly main?: boolean | undefined;
  };

  type StaticContentOptions = (
    | string
    | { path: string; ignore?: (string | RegExp)[] | undefined }
  )[];

  return {
    root,
    sources: ['src'],
    assets: ['src/assets'],
    staticContent: ['public'] as StaticContentOptions,

    /** Generating html options. */
    html: [] as HtmlOptions | HtmlOptions[],

    // /** Used by eslint webpack resolver. */
    // webpackConfig: '',
    /** Used by webpack loaders and plugins. */
    tsconfig: 'tsconfig.json',
    /** Plug'n'Play resolver for Webpack. */
    webpackPnpEnabled: false,

    output: {
      root,
      js: 'js',
      styles: 'styles' as
        | string
        | { dir?: string | undefined; extractorOptions?: AnyObject | undefined },
      assets: 'assets',
      external: 'lib',
      publicPath: '/',

      /** Generated asset manifest. */
      assetManifest: {
        /** For example: `asset-manifest.json`. */
        fileName: undefined as string | undefined,
        filterTemplate: undefined as AnyObject | undefined,
      },

      /** Generating service worker options (workbox-webpack-plugin). */
      sw: {
        /** For example: `service-worker.js`. */
        swDest: undefined as string | undefined,
        /** If provided then InjectManifest mode will be used. */
        swSrc: undefined as string | undefined,
      },
    },
  };
}

export function getNodeAppConfig(root = 'node') {
  return {
    root,
    sources: 'src',

    // /** Used by eslint webpack resolver. */
    // webpackConfig: '',
    /** Used by webpack loaders and plugins. */
    tsconfig: 'tsconfig.json',

    output: {
      root,
      publicPath: '/',
    },
  };
}

export function getSharedConfig(root = 'shared') {
  return {
    root,
    sources: 'src',
    tsconfig: 'tsconfig.json',
  };
}

export type BuildConfigDefaults = {
  output: {
    root: string;
  };
  nodeModules: {
    root: string;
  };
  web: ReturnType<typeof getWebAppConfig>;
  node: ReturnType<typeof getNodeAppConfig>;
  shared: ReturnType<typeof getSharedConfig>;
};

const buildConfigDefaults: BuildConfigDefaults = {
  output: {
    root: 'build',
  },
  nodeModules: {
    root: 'node_modules',
  },
  web: getWebAppConfig(),
  node: getNodeAppConfig(),
  shared: getSharedConfig(),
};

export default Object.freeze(buildConfigDefaults);
