import webpackMerge from 'webpack-merge';
import paths from '../paths';
import universalConfig from './universal.config';
import { baseDefaultRules } from './universal.config.ts';
import commonConfigTs from './common.config.ts';
import loaders from './loaders';
import { getAtsRule, mergeAndReplaceRules } from './utils';

export default ({ entry, rules, tsconfig = paths.server.tsconfig, nodeExternalsOptions }) => {
  const { tsRule, ...rest } = baseDefaultRules;

  const defaultRules = {
    tsRule: getAtsRule({ tsRule, rhl: false, tsconfig }),
    ...rest,
  };

  const moduleRules = mergeAndReplaceRules(defaultRules, rules);

  return webpackMerge(
    universalConfig({ entry, rules: moduleRules, nodeExternalsOptions }),
    commonConfigTs(),
    { plugins: [loaders.atsCheckerPlugin()] }
  );
};
