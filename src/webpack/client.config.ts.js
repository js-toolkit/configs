import webpackMerge from 'webpack-merge';
import * as path from 'path';
import paths from '../paths';
import clientConfig from './client.config';
import loaders from './loaders';

export default ({ entry, rules, tsconfigPath = path.join(paths.client.root, 'tsconfig.json') }) => {
  const defaultRules = {
    tsRule: {
      test: /\.tsx?$/,
      include: [paths.client.sources, paths.shared.sources],
      use: [
        'react-hot-loader/webpack',
        ...loaders.ts({
          tsconfig: tsconfigPath,
          forkedChecks: true,
        }),
      ],
    },
  };

  // Merge and replace rules
  const moduleRules = webpackMerge.strategy(
    Object.getOwnPropertyNames(defaultRules).reduce((obj, name) => ({ ...obj, [name]: 'replace' }))
  )(defaultRules, rules);

  return webpackMerge(clientConfig({ entry, rules: moduleRules }), {
    plugins: [loaders.tsCheckerPlugin({ tsconfig: tsconfigPath })],
  });
};
