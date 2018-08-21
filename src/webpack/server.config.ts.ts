import webpackMerge from 'webpack-merge';
import { Configuration } from 'webpack';
import paths from '../paths';
import commonConfigTs from './common.config.ts';
import serverConfig, { ConfigOptions as BaseConfigOptions } from './server.config';
import loaders, { BaseTsOptions } from './loaders';
import { getTsRule, mergeAndReplaceRules } from './utils';

export const baseDefaultRules = {
  tsRule: {
    test: /\.tsx?$/,
    include: [paths.server.sources, paths.shared.sources],
  },
};

export interface ConfigOptions extends BaseTsOptions, BaseConfigOptions {}

export default ({
  entry,
  rules,
  tsconfig = paths.server.tsconfig,
  nodeExternalsOptions,
}: ConfigOptions): Configuration => {
  const { tsRule, ...rest } = baseDefaultRules;

  const defaultRules = {
    tsRule: getTsRule({ tsRule, rhl: false, tsconfig }),
    ...rest,
  };

  const moduleRules = mergeAndReplaceRules(defaultRules, rules);

  return webpackMerge(
    serverConfig({ entry, rules: moduleRules, nodeExternalsOptions }),
    commonConfigTs(),
    { plugins: [loaders.tsCheckerPlugin({ tsconfig })] }
  );
};
