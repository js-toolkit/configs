import webpackMerge from 'webpack-merge';
import paths from '../paths';
import serverConfig from './server.config';
import commonConfigTs from './common.config.ts';
import loaders from './loaders';
import { getTsRule, mergeAndReplaceRules } from './utils';

export const baseDefaultRules = {
  tsRule: {
    test: /\.tsx?$/,
    include: [paths.server.sources, paths.shared.sources],
  },
};

export default ({ entry, rules, tsconfig = paths.server.tsconfig, nodeExternalsOptions }) => {
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
