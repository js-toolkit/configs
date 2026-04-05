# @js-toolkit/prettier-config

[![npm](https://img.shields.io/npm/v/@js-toolkit/prettier-config.svg?style=flat-square)](https://www.npmjs.org/package/@js-toolkit/prettier-config)
[![license](https://img.shields.io/npm/l/@js-toolkit/prettier-config.svg?style=flat-square)](https://www.npmjs.org/package/@js-toolkit/prettier-config)

Shared Prettier config.

## Install

```bash
pnpm add -D @js-toolkit/prettier-config prettier
```

## Config

| Option | Value |
|--------|-------|
|  `semi` | true |
|  `singleQuote` | true |
|  `jsxSingleQuote` | false |
|  `trailingComma` | all |
|  `printWidth` | 100 |
|  `tabWidth` | 2 |
|  `useTabs` | false |
|  `bracketSpacing` | true |
|  `bracketSameLine` | false |
|  `singleAttributePerLine` | false |
|  `arrowParens` | always |
|  `endOfLine` | lf |


## Usage

### ESM

```js
// prettier.config.js
export { default } from '@js-toolkit/prettier-config';
```

### CJS

```js
// prettier.config.cjs
module.exports = require('@js-toolkit/prettier-config').default;
```

### `package.json`

```json
{
  "prettier": "@js-toolkit/prettier-config"
}
```

### With overrides

```js
// prettier.config.js
import config from '@js-toolkit/prettier-config';

export default {
  ...config,
  printWidth: 120,
};
```

## License

MIT
