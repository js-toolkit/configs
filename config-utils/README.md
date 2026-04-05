# @js-toolkit/config-utils

[![npm](https://img.shields.io/npm/v/@js-toolkit/config-utils.svg?style=flat-square)](https://www.npmjs.org/package/@js-toolkit/config-utils)
[![license](https://img.shields.io/npm/l/@js-toolkit/config-utils.svg?style=flat-square)](https://www.npmjs.org/package/@js-toolkit/config-utils)

Shared utilities for project configuration: file extensions, dependency detection, and path resolution.

## Install

```bash
pnpm add @js-toolkit/config-utils
```

## Exports

### `extensions`

Module extension lists and glob helpers.

```ts
import {
  moduleExtensions,
  getFilesGlob,
  getTSExtensions,
  getJSExtensions,
  getSXExtensions,
  getTSXExtensions,
  getNonSXExtensions,
} from '@js-toolkit/config-utils/extensions';

getTSExtensions();              // ['.ts', '.mts', '.cts', '.tsx', ...]
getJSExtensions();              // ['.js', '.mjs', '.cjs', '.jsx', ...]
getFilesGlob(getTSExtensions(), 'src/'); // 'src/**/*.{ts,mts,cts,tsx,...}'
getTSExtensions(true);          // ['*.ts', '*.mts', '*.cts', '*.tsx', ...]
```

### `getInstalledPackage`

Check if a package is installed and resolvable.

```ts
import { getInstalledPackage } from '@js-toolkit/config-utils/getInstalledPackage';

const pkg = getInstalledPackage('typescript-eslint', { resolvePaths: true });
// 'typescript-eslint' if installed, undefined otherwise
```

### `getProjectDependencies`

Read all dependency names from a project's `package.json`.

```ts
import { getProjectDependencies } from '@js-toolkit/config-utils/getProjectDependencies';

const deps = getProjectDependencies([process.cwd()]);
// Set<string> { 'react', 'typescript', ... }
```

### `findPath`

Find the first existing path from a list of candidates.

```ts
import { findPath } from '@js-toolkit/config-utils/findPath';

const tsconfig = findPath('tsconfig.json', [process.cwd(), '/fallback/dir']);
// Absolute path to the first found tsconfig.json, or undefined
```

### `defaultRequire`

A `require` function created via `createRequire(import.meta.url)` for use in ESM modules.

```ts
import { defaultRequire } from '@js-toolkit/config-utils/defaultRequire';

const pkg = defaultRequire('some-cjs-package');
```

## License

MIT
