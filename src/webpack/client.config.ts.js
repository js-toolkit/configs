import webpackMerge from 'webpack-merge';
import * as path from 'path';
import paths from '../paths';
import clientConfig from './client.config';
import loaders from './loaders';

export default ({
  entry,
  rules = [],
  tsconfigPath = path.join(paths.client.root, 'tsconfig.json'),
}) => {
  const tsRules = [
    {
      test: /\.tsx?$/,
      include: [paths.client.sources, paths.shared.sources],
      use: loaders.ts({
        tsconfig: tsconfigPath,
        forkedChecks: true,
      }),
    },
  ].concat(rules);

  return webpackMerge(clientConfig({ entry, tsRules }), {
    plugins: [loaders.tsCheckerPlugin({ tsconfig: tsconfigPath })],
  });
};
