/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import path from 'path';
import { getAppRC } from './apprc';

export const moduleExtensions = ['.js', '.jsx', '.ts', '.tsx', '.d.ts'];

export function getPaths(baseDir = process.cwd(), apprc = getAppRC()) {
  return Object.freeze({
    root: baseDir,

    nodeModules: {
      // dirname: 'node_modules',
      root: path.resolve(baseDir, apprc.nodeModules),
    },

    output: {
      root: path.resolve(baseDir, apprc.output.root),
    },

    client: {
      root: path.resolve(baseDir, apprc.client.root),
      sources: path.resolve(baseDir, apprc.client.root, apprc.client.sources),
      assets: path.resolve(baseDir, apprc.client.root, apprc.client.assets),
      staticContent: apprc.client.staticContent.map((p) =>
        path.isAbsolute(p) ? p : path.resolve(baseDir, apprc.client.root, p)
      ),

      tsconfig: path.resolve(baseDir, apprc.client.root, apprc.client.tsconfig),

      output: {
        path: path.resolve(baseDir, apprc.output.root, apprc.client.output.root),
        jsPath: path.resolve(
          baseDir,
          apprc.output.root,
          apprc.client.output.root,
          apprc.client.output.js
        ),
      },
    },

    server: {
      root: path.resolve(baseDir, apprc.server.root),
      sources: path.resolve(baseDir, apprc.server.root, apprc.server.sources),

      tsconfig: path.resolve(baseDir, apprc.server.root, apprc.server.tsconfig),

      output: {
        path: path.resolve(baseDir, apprc.output.root, apprc.server.output.root),
      },
    },

    shared: {
      root: path.resolve(baseDir, apprc.shared.root),
      sources: path.resolve(baseDir, apprc.shared.root, apprc.shared.sources),
      tsconfig: path.resolve(baseDir, apprc.shared.root, apprc.shared.tsconfig),
    },
  });
}

/** Do not use it in runtime in browser environment! */
const paths = getPaths();

export default paths;
