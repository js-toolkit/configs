# @js-toolkit/configs

[![npm package](https://img.shields.io/npm/v/@js-toolkit/configs.svg?style=flat-square)](https://www.npmjs.org/package/@js-toolkit/configs)
[![license](https://img.shields.io/npm/l/@js-toolkit/configs.svg?style=flat-square)](https://www.npmjs.org/package/@js-toolkit/configs)

Preconfigured configurations for Webpack, ESLint, Babel, Prettier, TypeScript, JavaScript, and CSS. Utilities for project environment variables, build config, and path resolution.

## Install

```bash
yarn add @js-toolkit/configs
# or
npm install @js-toolkit/configs
```

## Requirements

- Node.js 16+
- Peer dependencies: install as needed for the modules you use (e.g. `eslint`, `webpack`, `typescript`, `prettier`)

## Package Contents

| Module | Description |
|--------|--------------|
| `eslint/common` | Base ESLint rules (JS/TS, import, promise, standard) |
| `eslint/web` | ESLint for web (React, JSX, a11y) |
| `eslint/universal` | Universal ESLint config |
| `paths` | Project paths, glob helpers for TS/JS |
| `webpack/web.config` | Webpack config for browser builds |
| `webpack/node.config` | Webpack config for Node builds |
| `buildConfig` | Build config from `build.config.js` |
| `appEnv` | NODE_ENV and APP_* environment variables |
| `getInstalledPackage` | Check if a package is installed (from cwd) |
| `prettier` | Prettier config |
| `ts/common` | TypeScript config for libraries |
| `ts/bundler` | TypeScript config for bundler targets |
| `babel/*` | Babel presets (react, ts, env) |
| `css/postcssConfig` | PostCSS config |
| `css/stylelintrc` | Stylelint config |

## Usage Examples

### ESLint

```javascript
// eslint.config.js (flat config)
const common = require('@js-toolkit/configs/eslint/common');

module.exports = [
  ...common,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
```

```javascript
// eslint.config.js with web (React) rules
const { getTSExtensions, getFilesGlob } = require('@js-toolkit/configs/paths');

module.exports = [
  ...require('@js-toolkit/configs/eslint/common'),
  ...require('@js-toolkit/configs/eslint/web'),
  {
    rules: { 'class-methods-use-this': 'off' },
  },
  {
    files: [getFilesGlob(getTSExtensions(), 'src/')],
    languageOptions: {
      parserOptions: { projectService: { defaultProject: 'tsconfig.json' } },
    },
  },
];
```

### Paths and globs

```javascript
const {
  getFilesGlob,
  getTSExtensions,
  getJSExtensions,
  getTSXExtensions,
} = require('@js-toolkit/configs/paths');

// Glob for all TS files in src/
getFilesGlob(getTSExtensions(), 'src/'); // 'src/**/*.{ts,mts,cts,tsx,...}'

// Extensions arrays
getTSExtensions();   // ['.ts', '.mts', '.cts', '.tsx', ...]
getJSExtensions();   // ['.js', '.mjs', '.cjs', '.jsx', ...]
```

### Build config

Create `build.config.js` in your project root:

```javascript
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

```javascript
const { getBuildConfig, resolveConfigPath } = require('@js-toolkit/configs/buildConfig');

const config = getBuildConfig();
config.envStringify(); // { 'process.env.buildConfig': '...' }

// Custom config path
const configPath = resolveConfigPath(['build.config', 'build.config.local'], [process.cwd()]);
```

### App environment

```javascript
const appEnv = require('@js-toolkit/configs/appEnv').default;

if (appEnv.dev) {
  // development mode
}
appEnv.ifDev(devValue, prodValue);
appEnv.ifProd(prodValue, devValue);

// Custom APP_* vars (from process.env)
appEnv.raw.APP_API_URL;
```

### Prettier

```javascript
// prettier.config.js
module.exports = require('@js-toolkit/configs/prettier');
```

### TypeScript

```json
// tsconfig.json
{
  "extends": "@js-toolkit/configs/ts/common.tsconfig.json",
  "compilerOptions": {
    "outDir": "dist"
  }
}
```

### Check installed package

```javascript
const { getInstalledPackage } = require('@js-toolkit/configs/getInstalledPackage');

// Resolve from project's node_modules (cwd)
const pkg = getInstalledPackage('typescript-eslint', { resolveFromCwd: true });
// pkg === 'typescript-eslint' if installed, undefined otherwise
```

## build.config.js structure

| Key | Description |
|-----|-------------|
| `output.root` | Output directory (default: `build`) |
| `web` | Web app config: `root`, `sources`, `assets`, `staticContent`, `tsconfig`, `output` |
| `node` | Node app config: `root`, `sources`, `tsconfig`, `output` |
| `shared` | Shared code: `root`, `sources`, `tsconfig` |

## Repository

[https://github.com/js-toolkit/configs](https://github.com/js-toolkit/configs)
