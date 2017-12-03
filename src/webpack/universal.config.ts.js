import webpackMerge from 'webpack-merge';
import path from 'path';
import paths from '../paths';
import universalConfig from './universal.config';
import loaders from './loaders';

export default (entry, tsconfigPath = path.join(paths.root, 'tsconfig.json')) =>
  webpackMerge(universalConfig(entry), {
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          include: [paths.server.sources, paths.client.sources, paths.shared.sources],
          use: loaders.ts({
            tsconfig: tsconfigPath,
            forkedChecks: true,
          }),
        },
      ],
    },

    plugins: [loaders.tsCheckerPlugin({ tsconfig: tsconfigPath })],
  });
