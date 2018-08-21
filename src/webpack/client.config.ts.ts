import { Omit } from 'typelevel-ts';
import webpackMerge from 'webpack-merge';
import { RuleSetRule, Configuration } from 'webpack';
import paths from '../paths';
import clientConfig, { ConfigOptions as BaseConfigOptions } from './client.config';
import commonConfigTs from './common.config.ts';
import loaders from './loaders';
import { getTsRule, mergeAndReplaceRules, GetTsRuleOptions } from './utils';

export const baseDefaultRules: Record<'tsRule', RuleSetRule> = {
  tsRule: {
    test: /\.tsx?$/,
    include: [paths.client.sources, paths.shared.sources],
  },
};

export interface ConfigOptions extends BaseConfigOptions, Omit<GetTsRuleOptions, 'tsRule'> {}

export default ({
  entry,
  rules,
  rhl = true,
  tsconfig = paths.client.tsconfig,
}: ConfigOptions): Configuration => {
  const { tsRule, ...rest } = baseDefaultRules;

  const defaultRules = {
    tsRule: getTsRule({ tsRule, rhl, tsconfig }),
    ...rest,
  };

  const moduleRules = mergeAndReplaceRules(defaultRules, rules);

  return webpackMerge(clientConfig({ entry, rules: moduleRules }), commonConfigTs(), {
    plugins: [loaders.tsCheckerPlugin({ tsconfig })],
  });
};
