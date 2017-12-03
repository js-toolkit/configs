import webpackMerge from 'webpack-merge';
import * as path from 'path';
import paths from '../paths';
import clientConfig from './client.config';
import loaders from './loaders';

export default (entry, tsconfigPath = path.join(paths.client.root, 'tsconfig.json')) =>
  webpackMerge(clientConfig(entry), {
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          include: [paths.client.sources, paths.shared.sources],
          use: loaders.ts({
            tsconfig: tsconfigPath,
            forkedChecks: true,
          }),
        },
      ],
    },

    plugins: [loaders.tsCheckerPlugin({ tsconfig: tsconfigPath })],
  });
