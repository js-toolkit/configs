import path from 'path';
import fs from 'fs';

const baseDir = process.cwd();

export const defaultDirMap = Object.freeze({
  outputDir: 'dist',
  clientDir: 'client',
  serverDir: 'server',
  sharedDir: 'shared',
});

const customDirMapPath = path.resolve(baseDir, 'dirmap.json');

export const dirMap = fs.existsSync(customDirMapPath)
  ? { ...defaultDirMap, ...require(customDirMapPath) }
  : defaultDirMap;

export default Object.freeze({
  root: baseDir,

  nodeModules: {
    dirname: 'node_modules',
    path: path.resolve(baseDir, 'node_modules'),
  },

  client: {
    root: path.resolve(baseDir, dirMap.clientDir),
    sources: path.resolve(baseDir, `${dirMap.clientDir}/src`),
    assets: path.resolve(baseDir, `${dirMap.clientDir}/src/assets`),
    staticContent: path.resolve(baseDir, `${dirMap.clientDir}/public`),

    output: {
      path: path.resolve(baseDir, `${dirMap.outputDir}/${dirMap.clientDir}`),
      // If multiple webpack configurations (i.e. client and server)
      // and used forked? process with express server
      // then for url-loader (fonts) must be equals to path suffix if path is subdir of output path.
      // publicPath: `/${dirMap.clientDir}/`,
      publicPath: '/',
      dir: dirMap.clientDir,
      js: 'js',
      styles: 'styles',
      assets: 'assets',
      external: 'lib',
    },
  },

  server: {
    root: path.resolve(baseDir, dirMap.serverDir),
    sources: path.resolve(baseDir, dirMap.serverDir),
    output: {
      path: path.resolve(baseDir, `${dirMap.outputDir}/${dirMap.serverDir}`),
      publicPath: '/',
    },
  },

  shared: {
    root: path.resolve(baseDir, dirMap.sharedDir),
  },
});
