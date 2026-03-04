/* eslint-disable @typescript-eslint/no-non-null-assertion */
import path from 'path';
import { getBuildConfig } from './buildConfig.ts';
import { defaultRequire } from './defaultRequire.ts';
import type { BuildConfigDefaults } from './buildConfigDefaults.ts';
import type { PickInner } from './types/index.ts';

export interface Paths extends Omit<BuildConfigDefaults, 'web' | 'node'> {
  root: string;
  web: PickInner<
    Omit<BuildConfigDefaults['web'], 'html' | 'staticContent'>,
    'output',
    'root' | 'js'
  > & { staticContent: Exclude<BuildConfigDefaults['web']['staticContent'][number], string>[] };
  node: PickInner<BuildConfigDefaults['node'], 'output', 'root'>;
  /** Any installed package. */
  getNodeModulesRoot(packageName: string): string;
}

export function getPaths(baseDir = process.cwd(), buildConfig = getBuildConfig()): Paths {
  return {
    root: baseDir,

    nodeModules: {
      root: (() => {
        const dir = buildConfig.nodeModules.root;
        try {
          const currentDir = import.meta.dirname;
          const idx = currentDir.indexOf(dir);
          // If cwd is inside node_modules dir.
          if (idx >= 0) {
            return currentDir.substring(0, idx + dir.length);
          }
          return path.resolve(baseDir, dir);
        } catch {
          return path.resolve(baseDir, dir);
        }
      })(),
    },

    output: {
      root: path.resolve(baseDir, buildConfig.output.root),
    },

    web: buildConfig.web
      ? {
          root: path.resolve(baseDir, buildConfig.web.root),
          sources: buildConfig.web.sources.map((p) =>
            path.resolve(baseDir, buildConfig.web!.root, p)
          ),
          assets: buildConfig.web.assets.map((p) =>
            path.resolve(baseDir, buildConfig.web!.root, p)
          ),
          staticContent: buildConfig.web.staticContent.map((item) => {
            const p = typeof item === 'string' ? { path: item } : item;
            return path.isAbsolute(p.path)
              ? p
              : { ...p, path: path.resolve(baseDir, buildConfig.web!.root, p.path) };
          }),

          tsconfig: path.resolve(baseDir, buildConfig.web.root, buildConfig.web.tsconfig),

          output: {
            root: path.resolve(baseDir, buildConfig.output.root, buildConfig.web.output.root),
            js: path.resolve(
              baseDir,
              buildConfig.output.root,
              buildConfig.web.output.root,
              buildConfig.web.output.js
            ),
          },
        }
      : {
          root: '',
          sources: [],
          assets: [],
          staticContent: [],
          tsconfig: '',
          output: {
            root: '',
            js: '',
          },
        },

    node: buildConfig.node
      ? {
          root: path.resolve(baseDir, buildConfig.node.root),
          sources: buildConfig.node.sources.map((p) =>
            path.resolve(baseDir, buildConfig.node!.root, p)
          ),
          tsconfig: path.resolve(baseDir, buildConfig.node.root, buildConfig.node.tsconfig),
          output: {
            root: path.resolve(baseDir, buildConfig.output.root, buildConfig.node.output.root),
          },
        }
      : {
          root: '',
          sources: [],
          tsconfig: '',
          output: {
            root: '',
          },
        },

    shared: buildConfig.shared
      ? {
          root: path.resolve(baseDir, buildConfig.shared.root),
          sources: buildConfig.shared.sources.map((p) =>
            path.resolve(baseDir, buildConfig.shared!.root, p)
          ),
          tsconfig: path.resolve(baseDir, buildConfig.shared.root, buildConfig.shared.tsconfig),
        }
      : {
          root: '',
          sources: [],
          tsconfig: '',
        },

    /** Any installed package. */
    getNodeModulesRoot(packageName: string): string {
      const modulePath = defaultRequire.resolve(packageName);
      const dir = 'node_modules';
      return modulePath.substring(0, modulePath.indexOf(dir) + dir.length);
    },
  };
}

/** Do not use it in runtime in browser environment! */
const paths = getPaths();

export default paths;

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
if (typeof module !== 'undefined') {
  module.exports = paths;
  module.exports.getPaths = getPaths;
}
