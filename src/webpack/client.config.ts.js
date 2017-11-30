import webpackMerge from 'webpack-merge';
import * as path from 'path';
import paths from '../paths';
import clientConfig from './client.config';
import loaders from './loaders';

export default entry =>
  webpackMerge(clientConfig(entry), {
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          include: [paths.client.sources, paths.shared.root],
          use: loaders.ts({
            tsconfig: path.join(paths.client.root, 'tsconfig.json'),
            forkedChecks: true,
          }),
        },
      ],
    },

    plugins: [loaders.tsCheckerPlugin({ tsconfig: path.join(paths.client.root, 'tsconfig.json') })],
  });
