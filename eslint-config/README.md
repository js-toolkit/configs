# @js-toolkit/eslint-config

[![npm](https://img.shields.io/npm/v/@js-toolkit/eslint-config.svg?style=flat-square)](https://www.npmjs.org/package/@js-toolkit/eslint-config)
[![license](https://img.shields.io/npm/l/@js-toolkit/eslint-config.svg?style=flat-square)](https://www.npmjs.org/package/@js-toolkit/eslint-config)

Shared ESLint flat config with custom rules for TypeScript projects.

## Install

```bash
pnpm add -D @js-toolkit/eslint-config eslint typescript typescript-eslint @eslint/js @eslint/compat eslint-config-prettier globals
```

## Exports

| Export | Description |
|--------|-------------|
| `./common` | Base config: TypeScript, import, promise, standard rules |
| `./web` | Web config: React, JSX, a11y (extends `common`) |
| `./plugin` | Custom ESLint plugin with additional rules |

## Usage

### Basic (TypeScript)

```js
// eslint.config.js
import { create } from '@js-toolkit/eslint-config/common';

export default create();
```

### With custom rules

```js
// eslint.config.js
import { create } from '@js-toolkit/eslint-config/common';

export default [
  ...create(),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
```

### Web (React)

```js
// eslint.config.js
import { create as createCommon } from '@js-toolkit/eslint-config/common';
import { create as createWeb } from '@js-toolkit/eslint-config/web';

export default [
  ...createCommon(),
  ...createWeb(),
];
```

### With typed linting

```js
// eslint.config.js
import { getFilesGlob, getTSExtensions } from '@js-toolkit/config-utils/extensions';
import { create as createCommon } from '@js-toolkit/eslint-config/common';

export default [
  ...createCommon(),
  {
    files: [getFilesGlob(getTSExtensions(), 'src/')],
    languageOptions: {
      parserOptions: { projectService: { defaultProject: 'tsconfig.json' } },
    },
  },
];
```

### Custom plugin

The package includes a custom ESLint plugin with the following rules:

- `@js-toolkit/strict-boolean-expressions` — stricter boolean expression checks
- `@js-toolkit/no-unnecessary-optional-chain` — disallow unnecessary optional chaining
- `@js-toolkit/no-namespace-except-declaration-merge` — disallow namespaces except for declaration merging

```js
// eslint.config.js
import plugin from '@js-toolkit/eslint-config/plugin';

export default [
  {
    plugins: { '@js-toolkit': plugin },
    rules: {
      '@js-toolkit/strict-boolean-expressions': 'error',
    },
  },
];
```

## Peer Dependencies

**Required:**

- `eslint` >= 9.0.0
- `typescript` >= 5.0.0
- `typescript-eslint` >= 8.0.0
- `@eslint/js` >= 10.0.0
- `@eslint/compat` >= 2.0.0
- `eslint-config-prettier` >= 10.0.0
- `globals` >= 15.0.0

**Optional** (auto-detected and applied when installed):

- `eslint-config-airbnb-base` / `eslint-config-airbnb`
- `eslint-config-standard`
- `eslint-plugin-import-x` / `eslint-plugin-import`
- `eslint-import-resolver-typescript`
- `eslint-plugin-promise`
- `eslint-plugin-react`, `eslint-plugin-react-hooks`
- `eslint-plugin-jsx-a11y`
- `eslint-plugin-prettier`
- `eslint-plugin-jsdoc` / `eslint-plugin-tsdoc`
- `eslint-plugin-wc` / `eslint-plugin-lit`
- `eslint-plugin-mobx`
- `@babel/eslint-parser`
- `ts-api-utils`

## License

MIT
