import webpackMerge from 'webpack-merge';
import { Configuration } from 'webpack';
import paths from '../paths';
import loaders from './loaders';
import clientConfig from './client.config';
import { baseDefaultRules, ConfigOptions } from './client.config.ts';
import commonConfigTs from './common.config.ts';
import { getAtsRule, mergeAndReplaceRules } from './utils';

export default ({
  entry,
  rules,
  rhl = true,
  tsconfig = paths.client.tsconfig,
}: ConfigOptions): Configuration => {
  const { tsRule, ...rest } = baseDefaultRules;

  const defaultRules = {
    tsRule: getAtsRule({ tsRule, rhl, tsconfig }),
    ...rest,
  };

  const moduleRules = mergeAndReplaceRules(defaultRules, rules);

  return webpackMerge(clientConfig({ entry, rules: moduleRules }), commonConfigTs(), {
    plugins: [loaders.atsCheckerPlugin()],
  });
};
