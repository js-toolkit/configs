import webpack from 'webpack';
import webpackMerge from 'webpack-merge';
import webpackNodeExternals from 'webpack-node-externals';
import fs from 'fs';
import path from 'path';
import reactEnv from '../env';
import paths from '../paths';
import serverConfig from './webpack.config.server.babel';
import loaders from './loaders';

export default entry =>
  webpackMerge(serverConfig(entry), {
    resolve: {
      modules: [paths.nodeModules.path, paths.server.sources, paths.client.sources, paths.context],
    },

    module: {
      rules: [
        {
          test: /\.jsx?$/,
          include: [paths.server.sources, paths.client.sources, paths.shared.root],
          use: loaders.babel(),
        },
        {
          test: /\.css$/,
          include: [paths.client.sources],
          use: loaders.css({ ssr: true, context: paths.client.sources }),
        },
        {
          test: /\.css$/,
          include: [paths.nodeModules.path],
          use: loaders.cssNodeModules({ ssr: true }),
        },
        {
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|otf)$/,
          include: [paths.client.assets],
          use: loaders.assets({ ssr: true }),
        },
        {
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|otf)$/,
          include: [paths.nodeModules.path],
          use: loaders.assetsNodeModules({ ssr: true }),
        },
      ],
    },

    plugins: [
      // Don't watch on client files when ssr is turned off.
      ...(reactEnv.ssr ? [] : [new webpack.WatchIgnorePlugin([paths.client.root])]),
    ],
  });
