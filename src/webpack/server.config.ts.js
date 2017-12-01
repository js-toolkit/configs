import webpackMerge from 'webpack-merge';
import paths from '../paths';
import serverConfig from './server.config';
import loaders from './loaders';

export default (entry, tsconfigPath = path.join(paths.server.root, 'tsconfig.json')) =>
  webpackMerge(serverConfig(entry), {
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          include: [paths.server.sources, paths.shared.root],
          use: loaders.ats(tsconfigPath),
        },
      ],
    },
  });
