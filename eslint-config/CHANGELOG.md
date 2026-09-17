# Changelog

## [1.3.0](https://github.com/js-toolkit/configs/compare/%40js-toolkit%2Feslint-config%401.2.1...%24%7Bnpm.name%7D%401.3.0) (2026-09-17)

### Features

* add support for @next/eslint-plugin-next ([7cd535c](https://github.com/js-toolkit/configs/commit/7cd535ca8621970de43365ee7a6e928f374d6511))

## [1.2.1](https://github.com/js-toolkit/configs/compare/%40js-toolkit%2Feslint-config%401.2.0...%24%7Bnpm.name%7D%401.2.1) (2026-09-17)

### Bug Fixes

* add publishArgs to npm configuration in release-it ([f0bc56f](https://github.com/js-toolkit/configs/commit/f0bc56f25d55392a78950002ae64753c51638460))
* add publishPackageManager to npm configuration for clarity ([85e1959](https://github.com/js-toolkit/configs/commit/85e1959240dfa4e4b1df69353a24fd984dd17eee))
* enable commit and tag options in release-it configuration ([4901549](https://github.com/js-toolkit/configs/commit/490154969eaee15fd1691dadad909c74da1d8b80))
* ensure clean working directory requirement is set in release-it configuration ([f47a5df](https://github.com/js-toolkit/configs/commit/f47a5df4a3a5b45376572cbdc7be8fe18d66b263))
* remove unnecessary commit and tag options from release-it configuration ([8d07686](https://github.com/js-toolkit/configs/commit/8d07686128d0a883b1ac0343c2dc8958311b7be6))

## [1.2.0](https://github.com/js-toolkit/configs/compare/%40js-toolkit%2Feslint-config%401.1.4...%24%7Bnpm.name%7D%401.2.0) (2026-09-17)

### Features

* add release-it support ([fffe41f](https://github.com/js-toolkit/configs/commit/fffe41f9dd24bfed6ce14fce57bc013cf2248467))
* refactor filterAirbnbRules to a standard function and add support for additional React plugins ([d20c0ec](https://github.com/js-toolkit/configs/commit/d20c0ecf5fddc9c78ab288797f3162c6c7c8cb5b))

### Bug Fixes

* add gitRawCommitsOpts to release-it configuration for improved commit tracking ([b58a356](https://github.com/js-toolkit/configs/commit/b58a3560b2ba7ebc12a147c9b69d5951bf14a673))
* correct type assertion in create function for Linter.Config ([09ecaf2](https://github.com/js-toolkit/configs/commit/09ecaf2296130d5421f0f92115a1e0546534ce20))
* update release-it configuration for consistent commit message and tag format ([8bcd06f](https://github.com/js-toolkit/configs/commit/8bcd06fd468f3ab94821b4e1bab346622a293c3a))
* update tagName and tagMatch in release-it configuration for correct npm variable usage ([ab469d5](https://github.com/js-toolkit/configs/commit/ab469d5ba239a43a2fd9fe6e876d606f5d6061f4))

# @js-toolkit/eslint-config

## 1.1.4

### Patch Changes

- Move some peer dependencies to normal

## 1.1.3

### Patch Changes

- Keep only next.js specific options from eslint-config-next
- Updated dependencies
  - @js-toolkit/config-utils@1.0.1

## 1.1.2

### Patch Changes

- Improve eslint-config-next filtering

## 1.1.1

### Patch Changes

- Fixes

## 1.1.0

### Minor Changes

- cd735b9: Add eslint-config-next. Add replacing import plugin.

## 1.0.0

### Major Changes

- 30befef: Split into focused packages

### Patch Changes

- Updated dependencies [30befef]
  - @js-toolkit/config-utils@1.0.0
