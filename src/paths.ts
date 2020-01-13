import path from 'path';
import apprc from './apprc';

const baseDir = process.cwd();

export const moduleExtensions = ['.js', '.jsx', '.ts', '.tsx', '.d.ts'];

/** Do not use it in runtime in browser environment! */
const paths = Object.freeze({
  root: baseDir,

  nodeModules: {
    dirname: 'node_modules',
    root: path.resolve(baseDir, 'node_modules'),
  },

  output: {
    root: path.resolve(baseDir, apprc.output.root),
  },

  client: {
    root: path.resolve(baseDir, apprc.client.root),
    sources: path.resolve(baseDir, apprc.client.root, apprc.client.sources),
    assets: path.resolve(baseDir, apprc.client.root, apprc.client.assets),
    staticContent: apprc.client.staticContent.map(p =>
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

export default paths;
