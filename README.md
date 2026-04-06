# @js-toolkit/configs

Monorepo with shared configurations for TypeScript, ESLint, Prettier, Webpack, Babel, and PostCSS.

## Packages

| Package | Description |
|---------|-------------|
| [`@js-toolkit/tsconfig`](./tsconfig/) | Shared TypeScript configurations (`common`, `bundler`) |
| [`@js-toolkit/eslint-config`](./eslint-config/) | ESLint flat config with custom rules (`common`, `web`, `plugin`) |
| [`@js-toolkit/prettier-config`](./prettier-config/) | Shared Prettier config |
| [`@js-toolkit/config-utils`](./config-utils/) | Shared utilities: file extensions, dependency detection, path resolution |
| [`@js-toolkit/build-utils`](./build-utils/) | Build tools: Webpack, Babel, PostCSS, Stylelint, appEnv, paths |

## Migrating from `@js-toolkit/configs`

The monolithic `@js-toolkit/configs` package has been split into focused packages:

| Old import | New package | New import |
|------------|-------------|------------|
| `@js-toolkit/configs/eslint/common` | `@js-toolkit/eslint-config` | `@js-toolkit/eslint-config/common` |
| `@js-toolkit/configs/eslint/web` | `@js-toolkit/eslint-config` | `@js-toolkit/eslint-config/web` |
| `@js-toolkit/configs/prettier` | `@js-toolkit/prettier-config` | `@js-toolkit/prettier-config` |
| `@js-toolkit/configs/ts/common.tsconfig.json` | `@js-toolkit/tsconfig` | `@js-toolkit/tsconfig/common` |
| `@js-toolkit/configs/ts/bundler.tsconfig.json` | `@js-toolkit/tsconfig` | `@js-toolkit/tsconfig/bundler` |
| `@js-toolkit/configs/extensions` | `@js-toolkit/config-utils` | `@js-toolkit/config-utils/extensions` |
| `@js-toolkit/configs/getInstalledPackage` | `@js-toolkit/config-utils` | `@js-toolkit/config-utils/getInstalledPackage` |
| `@js-toolkit/configs/getProjectDependencies` | `@js-toolkit/config-utils` | `@js-toolkit/config-utils/getProjectDependencies` |
| `@js-toolkit/configs/findPath` | `@js-toolkit/config-utils` | `@js-toolkit/config-utils/findPath` |
| `@js-toolkit/configs/defaultRequire` | `@js-toolkit/config-utils` | `@js-toolkit/config-utils/defaultRequire` |
| `@js-toolkit/configs/eslint/universal` | - | - |
| `@js-toolkit/configs/webpack/*` | `@js-toolkit/build-utils` | `@js-toolkit/build-utils/webpack/*` |
| `@js-toolkit/configs/babel/*` | `@js-toolkit/build-utils` | `@js-toolkit/build-utils/babel/*` |
| `@js-toolkit/configs/css/*` | `@js-toolkit/build-utils` | `@js-toolkit/build-utils/css/*` |
| `@js-toolkit/configs/paths` | `@js-toolkit/build-utils` | `@js-toolkit/build-utils/paths` |
| `@js-toolkit/configs/buildConfig` | `@js-toolkit/build-utils` | `@js-toolkit/build-utils/buildConfig` |
| `@js-toolkit/configs/appEnv` | `@js-toolkit/build-utils` | `@js-toolkit/build-utils/appEnv` |

## Development

```bash
pnpm install
pnpm build        # build all packages
```

### Versioning

This monorepo uses [Changesets](https://github.com/changesets/changesets) for independent versioning.

```bash
pnpm changeset          # create a changeset
pnpm version            # bump versions based on changesets
git commit -m "chore: version packages"
pnpm publish            # build and publish all changed packages
git push --follow-tags
```

## Repository

[https://github.com/js-toolkit/configs](https://github.com/js-toolkit/configs)

## License

MIT
