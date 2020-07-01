/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import path from 'path';
import { getBuildConfig } from './buildConfig';

export const moduleExtensions = ['.js', '.jsx', '.ts', '.tsx', '.d.ts'];

export function getPaths(baseDir = process.cwd(), buildConfig = getBuildConfig()) {
  return Object.freeze({
    root: baseDir,

    nodeModules: {
      // dirname: 'node_modules',
      root: path.resolve(baseDir, buildConfig.nodeModules),
    },

    output: {
      root: path.resolve(baseDir, buildConfig.output.root),
    },

    client: {
      root: path.resolve(baseDir, buildConfig.client.root),
      sources: path.resolve(baseDir, buildConfig.client.root, buildConfig.client.sources),
      assets: path.resolve(baseDir, buildConfig.client.root, buildConfig.client.assets),
      staticContent: buildConfig.client.staticContent.map((p) =>
        path.isAbsolute(p) ? p : path.resolve(baseDir, buildConfig.client.root, p)
      ),

      tsconfig: path.resolve(baseDir, buildConfig.client.root, buildConfig.client.tsconfig),

      output: {
        path: path.resolve(baseDir, buildConfig.output.root, buildConfig.client.output.root),
        jsPath: path.resolve(
          baseDir,
          buildConfig.output.root,
          buildConfig.client.output.root,
          buildConfig.client.output.js
        ),
      },
    },

    server: {
      root: path.resolve(baseDir, buildConfig.server.root),
      sources: path.resolve(baseDir, buildConfig.server.root, buildConfig.server.sources),

      tsconfig: path.resolve(baseDir, buildConfig.server.root, buildConfig.server.tsconfig),

      output: {
        path: path.resolve(baseDir, buildConfig.output.root, buildConfig.server.output.root),
      },
    },

    shared: {
      root: path.resolve(baseDir, buildConfig.shared.root),
      sources: path.resolve(baseDir, buildConfig.shared.root, buildConfig.shared.sources),
      tsconfig: path.resolve(baseDir, buildConfig.shared.root, buildConfig.shared.tsconfig),
    },
  });
}

/** Do not use it in runtime in browser environment! */
const paths = getPaths();

export default paths;
