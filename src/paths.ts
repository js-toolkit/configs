import path from 'path';
import appConfig from './appConfig';

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
    root: path.resolve(baseDir, appConfig.output.root),
  },

  client: {
    root: path.resolve(baseDir, appConfig.client.root),
    sources: path.resolve(baseDir, appConfig.client.root, appConfig.client.sources),
    assets: path.resolve(baseDir, appConfig.client.root, appConfig.client.assets),
    staticContent: path.resolve(baseDir, appConfig.client.root, appConfig.client.staticContent),

    tsconfig: path.resolve(baseDir, appConfig.client.root, appConfig.client.tsconfig),

    output: {
      path: path.resolve(baseDir, appConfig.output.root, appConfig.client.output.root),
      jsPath: path.resolve(
        baseDir,
        appConfig.output.root,
        appConfig.client.output.root,
        appConfig.client.output.js
      ),
    },
  },

  server: {
    root: path.resolve(baseDir, appConfig.server.root),
    sources: path.resolve(baseDir, appConfig.server.root, appConfig.server.sources),

    tsconfig: path.resolve(baseDir, appConfig.server.root, appConfig.server.tsconfig),

    output: {
      path: path.resolve(baseDir, appConfig.output.root, appConfig.server.output.root),
    },
  },

  shared: {
    root: path.resolve(baseDir, appConfig.shared.root),
    sources: path.resolve(baseDir, appConfig.shared.root, appConfig.shared.sources),
    tsconfig: path.resolve(baseDir, appConfig.shared.root, appConfig.shared.tsconfig),
  },

  envStringify() {
    return { 'process.env.paths': JSON.stringify(this) };
  },
});

export default paths;
