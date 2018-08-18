import webpackMerge from 'webpack-merge';
import paths from '../paths';
import loaders from './loaders';
import clientConfig from './client.config';
import { baseDefaultRules } from './client.config.ts';
import commonConfigTs from './common.config.ts';
import { getAtsRule, mergeAndReplaceRules } from './utils';

export default ({ entry, rules, rhl = true, tsconfig = paths.client.tsconfig }) => {
  const { tsRule, ...rest } = baseDefaultRules;

  const defaultRules = {
    tsRule: getAtsRule({ tsRule, rhl, tsconfig }),
    ...rest,
  };

  const customRules = typeof rules === 'function' ? rules({ rhl, tsconfig }) : rules;

  const moduleRules = mergeAndReplaceRules(defaultRules, customRules);

  return webpackMerge(clientConfig({ entry, rules: moduleRules }), commonConfigTs(), {
    plugins: [loaders.atsCheckerPlugin()],
  });
};
