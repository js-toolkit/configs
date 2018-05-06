import webpackMerge from 'webpack-merge';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import path from 'path';
import paths from '../paths';
import universalConfig from './universal.config';
import loaders from './loaders';

export const defaultRules = {
  tsRule: {
    test: /\.tsx?$/,
    include: [paths.server.sources, paths.client.sources, paths.shared.sources],
  },
};

export default ({
  entry,
  rules,
  tsconfigPath = path.join(paths.root, 'tsconfig.json'),
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

  return webpackMerge(universalConfig({ entry, rules: moduleRules, nodeExternalsOptions }), {
    resolve: {
      plugins: [new TsconfigPathsPlugin({ configFile: tsconfigPath })],
    },

    plugins: [loaders.tsCheckerPlugin({ tsconfig: tsconfigPath })],
  });
};
