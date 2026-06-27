# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- c8 test coverage reporting (`npm run test:coverage`)
- 19 new tests covering: ternary, isGeneratorFunction, memoizeSync, over (array/non-function), curry (3 args), curryN (arity 1, progressive), debounceTrailing, debounceBoth, debounce cancel/flush, throttleTrailing, throttleBoth, throttle cancel/flush, createMemoizer (weak/default), createThrottler, createDebouncer
- Test count: 26 → 49 (100% pass rate)
- Coverage: 97.45% statements, 92.36% branches, 100% functions

### Fixed
- `debounce({leading: true, trailing: true})` never fired the trailing call — `invokeFunc` set `timeoutId = null` which failed the `=== undefined` check for timer scheduling
- `throttle` trailing args not captured for calls within the wait window when `timeoutId` was already set

## [1.1.0] - 2026-06-20

### Added
- `VERSION` export constant for programmatic version access
- `--version` / `-V` CLI flags for quick version checks
- `exports` field in package.json for clean ESM/CJS dual consumption
- `files` field in package.json to control npm package contents
- `prepublishOnly` script to ensure tests pass before publishing
- `test:core` script for core test suite execution
- README comparison table vs lodash/ramda/underscore/fp-ts alternatives
- 3 real-world examples in README (event handling, API rate limiting, functional pipelines)
- Compelling README hook with test count and zero-dep status

### Fixed
- Test compatibility issues with Node.js native test runner:
  - Converted `debounce`, `debounceLeading`, `throttle`, `throttleLeading` from old callback pattern to async/await
  - Fixed `spread` test to call with individual args instead of array
  - Fixed `overArgs` test expectation from 6 to 5 (correct math)
  - Fixed `rateLimit` test timing expectations to validate all calls execute

### Changed
- Improved README with clearer feature descriptions
- Enhanced CLI help output with comprehensive function reference
- Updated documentation with more practical examples

## [1.0.0] - 2024-03-15

### Added
- Initial release of function-x
- 20+ higher-order function utilities:
  - Basic: identity, constant, noop, unary, binary, ternary, negate, tap, over
  - Type checking: isFunction, isAsyncFunction, isGeneratorFunction
  - Currying: curry, curryN
  - Partial application: partial, partialRight
  - Composition: compose, pipe
  - Memoization: memoize, memoizeSync, memoizeClear
  - Debouncing: debounce, debounceLeading, debounceTrailing, debounceBoth
  - Throttling: throttle, throttleLeading, throttleTrailing, throttleBoth
  - Rate limiting: rateLimit
  - Utilities: once, after, before, spread, overArgs
  - Factory: createMemoizer, createThrottler, createDebouncer
- Interactive CLI with demo, help, and version commands
- Comprehensive test suite (26 tests)
- Zero dependencies
- ESM module support

[1.1.0]: https://github.com/sulthonzh/function-x/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/sulthonzh/function-x/releases/tag/v1.0.0