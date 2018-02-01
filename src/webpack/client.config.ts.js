import webpackMerge from 'webpack-merge';
import * as path from 'path';
import paths from '../paths';
import reactEnv from '../reactEnv';
import clientConfig from './client.config';
import loaders from './loaders';

export const defaultRules = {
  tsRule: {
    test: /\.tsx?$/,
    include: [paths.client.sources, paths.shared.sources],
  },
};

export default ({ entry, rules, tsconfigPath = path.join(paths.client.root, 'tsconfig.json') }) => {
  const { tsRule, ...rest } = defaultRules;

  const useDefaultRules = {
    tsRule: {
      ...tsRule,
      use: loaders.ts({
        tsconfig: tsconfigPath,
        forkedChecks: true,
        afterLoaders: reactEnv.ifDevMode(
          [
            {
              // Necessary for RHL4.
              // Not working with RHL3 and DateRangePicker.
              loader: 'babel-loader',
            },
          ],
          []
        ),
      }),
    },
    ...rest,
  };

  // Merge and replace rules
  const moduleRules = webpackMerge.strategy(
    Object.getOwnPropertyNames(useDefaultRules).reduce(
      (obj, name) => ({
        ...obj,
        [name]: 'replace',
      }),
      {}
    )
  )(useDefaultRules, rules);

  return webpackMerge(clientConfig({ entry, rules: moduleRules }), {
    plugins: [loaders.tsCheckerPlugin({ tsconfig: tsconfigPath })],
  });
};
