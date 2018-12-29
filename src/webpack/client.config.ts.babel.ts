import webpackMerge from 'webpack-merge';
import { RuleSetRule, Configuration } from 'webpack';
import paths from '../paths';
import clientConfig, { ConfigOptions as BaseConfigOptions } from './client.config';
import commonConfigTs from './common.config.ts';
import loaders, { BaseTsOptions } from './loaders';
import { mergeAndReplaceRules } from './utils';

export const defaultRules: Record<'tsRule', RuleSetRule> = {
  tsRule: {
    test: /\.tsx?$/,
    include: [paths.client.sources, paths.shared.sources],
    use: loaders.babel(),
  },
};

export interface ConfigOptions extends BaseConfigOptions, BaseTsOptions {}

export default ({
  entry,
  rules,
  tsconfig = paths.client.tsconfig,
}: ConfigOptions): Configuration => {
  const moduleRules = mergeAndReplaceRules(defaultRules, rules);

  return webpackMerge(clientConfig({ entry, rules: moduleRules }), commonConfigTs(), {
    plugins: [loaders.tsCheckerPlugin({ tsconfig })],
  });
};
