/* eslint-disable @typescript-eslint/explicit-function-return-type */
import path from 'path';
import { getBuildConfig } from './buildConfig';

export const moduleExtensions = [
  '.js',
  '.mjs',
  '.cjs',
  '.jsx',
  '.mjsx',
  '.cjsx',
  '.ts',
  '.mts',
  '.cts',
  '.tsx',
  '.mtsx',
  '.ctsx',
  '.d.ts',
];

function addStar(extensions: string[]): string[] {
  return extensions.map((ext) => `*${ext}`);
}

export function getFilesGlob(extensions: string[], basePath?: string): string {
  return (
    path.join(basePath || '', '**/*.{') + extensions.map((ext) => ext.substring(1)).join(',') + '}'
  );
}

export function getTSExtensions(withStar = false): string[] {
  const list = moduleExtensions.filter((ext) => ext.includes('ts'));
  return withStar ? addStar(list) : list;
}

export function getJSExtensions(withStar = false): string[] {
  const list = moduleExtensions.filter((ext) => ext.includes('js'));
  return withStar ? addStar(list) : list;
}

export function getSXExtensions(withStar = false): string[] {
  const list = moduleExtensions.filter((ext) => ext.endsWith('sx'));
  return withStar ? addStar(list) : list;
}

export function getTSXExtensions(withStar = false): string[] {
  const list = moduleExtensions.filter((ext) => ext.endsWith('tsx'));
  return withStar ? addStar(list) : list;
}

export function getNonSXExtensions(withStar = false): string[] {
  const list = moduleExtensions.filter((ext) => !ext.endsWith('sx'));
  return withStar ? addStar(list) : list;
}

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

    web: (() => {
      const { web } = buildConfig;

      if (!web) {
        return {
          root: '',
          sources: [],
          assets: [],
          staticContent: [],
          tsconfig: '',
          output: {
            path: '',
            jsPath: '',
          },
        };
      }

      return {
        root: path.resolve(baseDir, web.root),
        sources: web.sources.map((p) => path.resolve(baseDir, web.root, p)),
        assets: web.assets.map((p) => path.resolve(baseDir, web.root, p)),
        staticContent: web.staticContent.map((item) => {
          const p = typeof item === 'string' ? { path: item } : item;
          return path.isAbsolute(p.path)
            ? p
            : { ...p, path: path.resolve(baseDir, web.root, p.path) };
        }),

        tsconfig: path.resolve(baseDir, web.root, web.tsconfig),

        output: {
          path: path.resolve(baseDir, buildConfig.output.root, web.output.root),
          jsPath: path.resolve(baseDir, buildConfig.output.root, web.output.root, web.output.js),
        },
      };
    })(),

    node: (() => {
      const { node } = buildConfig;

      if (!node) {
        return {
          root: '',
          sources: [],
          tsconfig: '',
          output: {
            path: '',
          },
        };
      }

      return {
        root: path.resolve(baseDir, node.root),
        sources: node.sources.map((p) => path.resolve(baseDir, node.root, p)),
        tsconfig: path.resolve(baseDir, node.root, node.tsconfig),
        output: {
          path: path.resolve(baseDir, buildConfig.output.root, node.output.root),
        },
      };
    })(),

    shared: (() => {
      const { shared } = buildConfig;

      if (!shared) {
        return {
          root: '',
          sources: [],
          tsconfig: '',
        };
      }

      return {
        root: path.resolve(baseDir, shared.root),
        sources: shared.sources.map((p) => path.resolve(baseDir, shared.root, p)),
        tsconfig: path.resolve(baseDir, shared.root, shared.tsconfig),
      };
    })(),
  });
}

/** Do not use it in runtime in browser environment! */
const paths = getPaths();

export default paths;
