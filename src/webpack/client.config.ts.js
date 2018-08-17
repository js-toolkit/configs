import webpackMerge from 'webpack-merge';
import * as path from 'path';
import paths from '../paths';
import clientConfig from './client.config';
import commonConfigTs from './common.config.ts';
import loaders from './loaders';

export const baseDefaultRules = {
  tsRule: {
    test: /\.tsx?$/,
    include: [paths.client.sources, paths.shared.sources],
  },
};

export function getDefaultRules({ rhl, tsconfigPath } = {}) {
  const { tsRule, ...rest } = baseDefaultRules;

  return {
    tsRule: {
      ...tsRule,
      use: (rhl ? loaders.tsRHL4 : loaders.ts)({ tsconfig: tsconfigPath, forkedChecks: true }),
    },
    ...rest,
  };
}

export default ({
  entry,
  rules,
  rhl = true,
  tsconfigPath = path.join(paths.client.root, 'tsconfig.json'),
}) => {
  const defaultRules = getDefaultRules({ rhl, tsconfigPath });

  const customRules = typeof rules === 'function' ? rules({ rhl, tsconfigPath }) : rules;

  // Merge and replace rules
  const moduleRules = webpackMerge.strategy(
    Object.getOwnPropertyNames(defaultRules).reduce(
      (obj, name) => ({ ...obj, [name]: 'replace' }),
      {}
    )
  )(defaultRules, customRules);

  return webpackMerge(commonConfigTs(), clientConfig({ entry, rules: moduleRules }), {
    plugins: [loaders.tsCheckerPlugin({ tsconfig: tsconfigPath })],
  });
};
