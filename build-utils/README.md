# @js-toolkit/build-utils

[![npm](https://img.shields.io/npm/v/@js-toolkit/build-utils.svg?style=flat-square)](https://www.npmjs.org/package/@js-toolkit/build-utils)
[![license](https://img.shields.io/npm/l/@js-toolkit/build-utils.svg?style=flat-square)](https://www.npmjs.org/package/@js-toolkit/build-utils)

Build configuration utilities for Webpack, Babel, PostCSS, Stylelint, and project environment.

## Install

```bash
pnpm add -D @js-toolkit/build-utils
```

## Modules

| Export | Description |
|--------|-------------|
| `./appEnv` | `NODE_ENV` and `APP_*` environment variables for Webpack DefinePlugin |
| `./buildConfig` | Read `build.config.js` with project structure (output, web, node, shared) |
| `./paths` | Resolved project paths based on `build.config.js` |
| `./webpack/web.config` | Webpack config for browser builds |
| `./webpack/node.config` | Webpack config for Node.js builds |
| `./webpack/common.config` | Shared Webpack config base |
| `./babel/env.babelrc` | Babel `@babel/preset-env` config |
| `./babel/react.babelrc` | Babel React preset config |
| `./babel/ts.env.babelrc` | Babel TypeScript + env config |
| `./babel/ts.react.babelrc` | Babel TypeScript + React config |
| `./css/postcssConfig` | PostCSS config |
| `./css/stylelintrc` | Stylelint config |
| `./eslint/universal` | ESLint config combining common + web with build paths |

## Usage

### App Environment

```ts
import appEnv from '@js-toolkit/build-utils/appEnv';

appEnv.dev;   // NODE_ENV === 'development'
appEnv.prod;  // NODE_ENV === 'production'
appEnv.test;  // NODE_ENV === 'test' || APP_TEST

appEnv.ifDev('dev-value', 'prod-value');
appEnv.ifProd('prod-value', 'dev-value');

// Custom APP_* variables from process.env
appEnv.raw.APP_API_URL;

// For Webpack DefinePlugin
appEnv.envStringify(); // { 'process.env': { NODE_ENV: '"development"', ... } }
```

### Build Config

Create `build.config.js` in your project root:

```js
module.exports = {
  output: { root: 'dist' },
  web: {
    root: 'web',
    sources: ['src'],
    assets: ['src/assets'],
    staticContent: ['public'],
    tsconfig: 'tsconfig.json',
    output: { root: 'web', js: 'js' },
  },
};
```

```ts
import { getBuildConfig, resolveConfigPath } from '@js-toolkit/build-utils/buildConfig';

const config = getBuildConfig();
config.envStringify(); // { 'process.env.buildConfig': '...' }
```

### Paths

```ts
import { getPaths } from '@js-toolkit/build-utils/paths';

const paths = getPaths();
paths.root;                // project root (cwd)
paths.web.sources;         // resolved web source directories
paths.web.output.root;     // resolved web output directory
paths.node.output.root;    // resolved node output directory
paths.getNodeModulesRoot('react'); // path to react in node_modules
```

### Webpack

```ts
import { createWebConfig } from '@js-toolkit/build-utils/webpack/web.config';
import { createNodeConfig } from '@js-toolkit/build-utils/webpack/node.config';

const webConfig = createWebConfig({ /* options */ });
const nodeConfig = createNodeConfig({ /* options */ });
```

### Babel

```ts
// babel.config.js
import reactBabelrc from '@js-toolkit/build-utils/babel/react.babelrc';
import tsReactBabelrc from '@js-toolkit/build-utils/babel/ts.react.babelrc';

export default tsReactBabelrc;
```

### CSS

```ts
import postcssConfig from '@js-toolkit/build-utils/css/postcssConfig';
import stylelintrc from '@js-toolkit/build-utils/css/stylelintrc';
```

### ESLint (Universal)

Build-aware ESLint config that uses `build.config.js` paths:

```js
// eslint.config.js
import { create } from '@js-toolkit/build-utils/eslint/universal';

export default create();
```

## `build.config.js` Structure

| Key | Description |
|-----|-------------|
| `output.root` | Output directory (default: `build`) |
| `web` | Web app config: `root`, `sources`, `assets`, `staticContent`, `tsconfig`, `output` |
| `node` | Node app config: `root`, `sources`, `tsconfig`, `output` |
| `shared` | Shared code: `root`, `sources`, `tsconfig` |

## License

MIT
