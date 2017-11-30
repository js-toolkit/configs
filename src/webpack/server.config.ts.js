import webpackMerge from 'webpack-merge';
import paths from '../paths';
import serverConfig from './server.config';
import loaders from './loaders';

export default entry =>
  webpackMerge(serverConfig(entry), {
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          include: [paths.server.sources, paths.shared.root],
          use: loaders.ats('./server/tsconfig.json'),
        },
      ],
    },
  });
