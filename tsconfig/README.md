# @js-toolkit/tsconfig

[![npm](https://img.shields.io/npm/v/@js-toolkit/tsconfig.svg?style=flat-square)](https://www.npmjs.org/package/@js-toolkit/tsconfig)
[![license](https://img.shields.io/npm/l/@js-toolkit/tsconfig.svg?style=flat-square)](https://www.npmjs.org/package/@js-toolkit/tsconfig)

Shared TypeScript configurations.

## Install

```bash
pnpm add -D @js-toolkit/tsconfig typescript
```

## Configs

### `common`

Strict TypeScript config for libraries and Node.js projects.

- `module: "nodenext"` / `moduleResolution: "nodenext"`
- `strict: true` with all additional strict checks enabled
- `verbatimModuleSyntax: true`
- `rewriteRelativeImportExtensions: true`
- `jsx: "react-jsx"`

```json
{
  "extends": "@js-toolkit/tsconfig/common",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### `bundler`

Extends `common` with bundler-friendly settings. Suitable for projects built with Webpack, Vite, or other bundlers.

- `module: "esnext"` / `moduleResolution: "bundler"`
- `noEmit: true`

```json
{
  "extends": "@js-toolkit/tsconfig/bundler",
  "compilerOptions": {
    "types": ["node"]
  },
  "include": ["src"]
}
```

## Included Options

<details>
<summary>Full <code>common</code> compilerOptions</summary>

| Option | Value |
|--------|-------|
| `target` | ESNext |
| `module` | nodenext |
| `moduleResolution` | nodenext |
| `lib` | DOM, DOM.Iterable, ESNext |
| `jsx` | react-jsx |
| `strict` | true |
| `noUnusedLocals` | true |
| `noUnusedParameters` | true |
| `noImplicitReturns` | true |
| `noImplicitOverride` | true |
| `noFallthroughCasesInSwitch` | true |
| `noUncheckedSideEffectImports` | true |
| `exactOptionalPropertyTypes` | true |
| `esModuleInterop` | true |
| `resolveJsonModule` | true |
| `verbatimModuleSyntax` | true |
| `rewriteRelativeImportExtensions` | true |
| `forceConsistentCasingInFileNames` | true |
| `importHelpers` | true |
| `skipLibCheck` | true |
| `sourceMap` | true |
| `incremental` | true |

</details>

## License

MIT
