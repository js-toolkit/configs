import path from 'path';
import webpackMerge from 'webpack-merge';
import paths from '../paths';
import serverConfig from './server.config';
import commonConfigTs from './common.config.ts';
import loaders from './loaders';

export const defaultRules = {
  tsRule: {
    test: /\.tsx?$/,
    include: [paths.server.sources, paths.shared.sources],
  },
};

export default ({
  entry,
  rules,
  tsconfigPath = path.join(paths.server.root, 'tsconfig.json'),
  nodeExternalsOptions,
}) => {
  const { tsRule, ...rest } = defaultRules;

  const useDefaultRules = {
    tsRule: {
      ...tsRule,
      use: loaders.ts({ tsconfig: tsconfigPath, forkedChecks: true }),
    },
    ...rest,
  };

  // Merge and replace rules
  const moduleRules = webpackMerge.strategy(
    Object.getOwnPropertyNames(useDefaultRules).reduce(
      (obj, name) => ({ ...obj, [name]: 'replace' }),
      {}
    )
  )(useDefaultRules, rules);

  return webpackMerge(
    commonConfigTs(),
    serverConfig({ entry, rules: moduleRules, nodeExternalsOptions }),
    { plugins: [loaders.tsCheckerPlugin({ tsconfig: tsconfigPath })] }
  );
};
