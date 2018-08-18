import webpackMerge from 'webpack-merge';
import paths from '../paths';
import clientConfig from './client.config';
import commonConfigTs from './common.config.ts';
import loaders from './loaders';
import { getTsRule, mergeAndReplaceRules } from './utils';

export const baseDefaultRules = {
  tsRule: {
    test: /\.tsx?$/,
    include: [paths.client.sources, paths.shared.sources],
  },
};

export default ({ entry, rules, rhl = true, tsconfig = paths.client.tsconfig }) => {
  const { tsRule, ...rest } = baseDefaultRules;

  const defaultRules = {
    tsRule: getTsRule({ tsRule, rhl, tsconfig }),
    ...rest,
  };

  const customRules = typeof rules === 'function' ? rules({ rhl, tsconfig }) : rules;

  const moduleRules = mergeAndReplaceRules(defaultRules, customRules);

  return webpackMerge(clientConfig({ entry, rules: moduleRules }), commonConfigTs(), {
    plugins: [loaders.tsCheckerPlugin({ tsconfig })],
  });
};
