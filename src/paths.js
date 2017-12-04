import path from 'path';
import fs from 'fs';
import deepmerge from 'deepmerge';
import defaultDirMap from './dirmap';

const baseDir = process.cwd();

const customDirMapPath = path.resolve(baseDir, 'dirmap.json');

export const dirMap = fs.existsSync(customDirMapPath)
  ? deepmerge(defaultDirMap, require(customDirMapPath))
  : defaultDirMap;

export default Object.freeze({
  root: baseDir,

  nodeModules: {
    dirname: 'node_modules',
    root: path.resolve(baseDir, 'node_modules'),
  },

  output: {
    root: path.resolve(baseDir, dirMap.output.root),
  },

  client: {
    root: path.resolve(baseDir, dirMap.client.root),
    sources: path.resolve(baseDir, dirMap.client.root, dirMap.client.sources),
    assets: path.resolve(baseDir, dirMap.client.root, dirMap.client.assets),
    staticContent: path.resolve(baseDir, dirMap.client.root, dirMap.client.staticContent),

    output: {
      path: path.resolve(baseDir, dirMap.output.root, dirMap.client.output.root),
      js: dirMap.client.output.js,
      styles: dirMap.client.output.styles,
      assets: dirMap.client.output.assets,
      external: dirMap.client.output.external,
      // If multiple webpack configurations (i.e. client and server)
      // and used forked? process with express server
      // then for url-loader (fonts) must be equals to path suffix if path is subdir of output path.
      // publicPath: `/${dirMap.client.root}/`,
      publicPath: dirMap.client.output.publicPath,
    },
  },

  server: {
    root: path.resolve(baseDir, dirMap.server.root),
    sources: path.resolve(baseDir, dirMap.server.root, dirMap.server.sources),

    output: {
      path: path.resolve(baseDir, dirMap.output.root, dirMap.server.output.root),
      publicPath: dirMap.server.output.publicPath,
    },
  },

  shared: {
    root: path.resolve(baseDir, dirMap.shared.root),
    sources: path.resolve(baseDir, dirMap.shared.root, dirMap.shared.sources),
  },
});
