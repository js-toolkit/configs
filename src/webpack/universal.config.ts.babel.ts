import webpackMerge from 'webpack-merge';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { Configuration } from 'webpack';
import paths from '../paths';
import commonConfigTs from './common.config.ts';
import { ConfigOptions } from './server.config.ts';
import universalConfig from './universal.config';
import loaders from './loaders';
import { mergeAndReplaceRules } from './utils';

export const defaultRules = {
  tsRule: {
    test: /\.tsx?$/,
    include: [paths.server.sources, paths.client.sources, paths.shared.sources],
    use: loaders.babel(),
  },
};

export default ({
  entry,
  rules,
  tsconfig = paths.server.tsconfig,
  nodeExternalsOptions,
}: ConfigOptions): Configuration => {
  const moduleRules = mergeAndReplaceRules(defaultRules, rules);

  return webpackMerge(
    universalConfig({ entry, rules: moduleRules, nodeExternalsOptions }),
    {
      resolve: {
        plugins: [new TsconfigPathsPlugin({ configFile: tsconfig })],
      },

      plugins: [loaders.tsCheckerPlugin({ tsconfig })],
    },
    commonConfigTs()
  );
};
