import path from 'path';
import fs from 'fs';
import webpackMerge from 'webpack-merge';
import defaultDirMap from './dirmap';

export type DirMapConfig = typeof defaultDirMap;

const baseDir = process.cwd();

const customDirMapPath = path.resolve(baseDir, 'dirmap.json');

function loadCustomDirMap(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath).toString());
}

export const dirMap: DirMapConfig = fs.existsSync(customDirMapPath)
  ? (webpackMerge(defaultDirMap as any, loadCustomDirMap(customDirMapPath)) as any)
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
