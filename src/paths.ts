import path from 'path';
import webpackMerge from 'webpack-merge';
import defaultDirMap from './dirmap';

function resolveDirMapPath(filename: string) {
  try {
    return require.resolve(filename, { paths: [baseDir] });
  } catch {
    return '';
  }
}

export type DirMapConfig = typeof defaultDirMap;

const baseDir = process.cwd();

const dirMapFileName = 'dirmap';
const customDirMapPath = resolveDirMapPath(dirMapFileName);

export const dirMap: DirMapConfig = customDirMapPath
  ? (webpackMerge(defaultDirMap as any, require(customDirMapPath) as any) as DirMapConfig) // eslint-disable-line global-require, import/no-dynamic-require
  : defaultDirMap;

export const moduleFileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.d.ts'];

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

    tsconfig: path.resolve(baseDir, dirMap.client.root, dirMap.client.tsconfig),

    output: {
      path: path.resolve(baseDir, dirMap.output.root, dirMap.client.output.root),
      jsPath: path.resolve(
        baseDir,
        dirMap.output.root,
        dirMap.client.output.root,
        dirMap.client.output.js
      ),
    },
  },

  server: {
    root: path.resolve(baseDir, dirMap.server.root),
    sources: path.resolve(baseDir, dirMap.server.root, dirMap.server.sources),

    tsconfig: path.resolve(baseDir, dirMap.server.root, dirMap.server.tsconfig),

    output: {
      path: path.resolve(baseDir, dirMap.output.root, dirMap.server.output.root),
    },
  },

  shared: {
    root: path.resolve(baseDir, dirMap.shared.root),
    sources: path.resolve(baseDir, dirMap.shared.root, dirMap.shared.sources),
    tsconfig: path.resolve(baseDir, dirMap.shared.root, dirMap.shared.tsconfig),
  },
});
