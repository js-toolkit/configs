/* eslint-disable @typescript-eslint/explicit-function-return-type */
import path from 'path';
import { getBuildConfig } from './buildConfig';

export const moduleExtensions = ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.d.ts'];

export function getPaths(baseDir = process.cwd(), buildConfig = getBuildConfig()) {
  return Object.freeze({
    root: baseDir,

    nodeModules: {
      root: (() => {
        const dir = buildConfig.nodeModules.root;
        try {
          const idx = __dirname.indexOf(dir);
          // Id cwd is inside node_modules dir.
          if (idx >= 0) {
            return __dirname.substring(0, idx + dir.length);
          }
          return path.resolve(baseDir, dir);
        } catch {
          return path.resolve(baseDir, dir);
        }
      })(),
    },

    /** Any installed package. */
    getNodeModulesRoot(packageName: string): string {
      const modulePath = require.resolve(packageName);
      const dir = 'node_modules';
      return modulePath.substring(0, modulePath.indexOf(dir) + dir.length);
    },

    output: {
      root: path.resolve(baseDir, buildConfig.output.root),
    },

    client: (() => {
      const { client } = buildConfig;

      if (!client) {
        return {
          root: '',
          sources: '',
          assets: '',
          staticContent: [],
          tsconfig: '',
          output: {
            path: '',
            jsPath: '',
          },
        };
      }

      return {
        root: path.resolve(baseDir, client.root),
        sources: path.resolve(baseDir, client.root, client.sources),
        assets: path.resolve(baseDir, client.root, client.assets),
        staticContent: client.staticContent.map((item) => {
          const p = typeof item === 'string' ? { path: item } : item;
          return path.isAbsolute(p.path)
            ? p
            : { ...p, path: path.resolve(baseDir, client.root, p.path) };
        }),

        tsconfig: path.resolve(baseDir, client.root, client.tsconfig),

        output: {
          path: path.resolve(baseDir, buildConfig.output.root, client.output.root),
          jsPath: path.resolve(
            baseDir,
            buildConfig.output.root,
            client.output.root,
            client.output.js
          ),
        },
      };
    })(),

    server: (() => {
      const { server } = buildConfig;

      if (!server) {
        return {
          root: '',
          sources: '',
          tsconfig: '',
          output: {
            path: '',
          },
        };
      }

      return {
        root: path.resolve(baseDir, server.root),
        sources: path.resolve(baseDir, server.root, server.sources),

        tsconfig: path.resolve(baseDir, server.root, server.tsconfig),

        output: {
          path: path.resolve(baseDir, buildConfig.output.root, server.output.root),
        },
      };
    })(),

    shared: (() => {
      const { shared } = buildConfig;

      if (!shared) {
        return {
          root: '',
          sources: '',
          tsconfig: '',
        };
      }

      return {
        root: path.resolve(baseDir, shared.root),
        sources: path.resolve(baseDir, shared.root, shared.sources),
        tsconfig: path.resolve(baseDir, shared.root, shared.tsconfig),
      };
    })(),
  });
}

/** Do not use it in runtime in browser environment! */
const paths = getPaths();

export default paths;
