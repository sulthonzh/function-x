#!/usr/bin/env node

/**
 * Coverage gap tests for function-x
 * Targeting uncovered branches identified by c8 report
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import * as fx from '../function-x.js';

const cliPath = new URL('../cli.js', import.meta.url).pathname;

// === Branch coverage: unary line 13 (fn.length === 1 → return fn as-is) ===

test('unary returns fn as-is when fn.length === 1', () => {
  const fn = x => x + 1;
  const result = fx.unary(fn);
  assert.strictEqual(result, fn); // Same reference returned
  assert.strictEqual(result(5), 6);
});

// === Branch coverage: binary line 14 (fn.length === 2 → return fn as-is) ===

test('binary returns fn as-is when fn.length === 2', () => {
  const fn = (a, b) => a + b;
  const result = fx.binary(fn);
  assert.strictEqual(result, fn); // Same reference returned
  assert.strictEqual(result(3, 4), 7);
});

// === Branch coverage: curryN line 43 (arity === 0 → return fn()) ===

test('curryN with arity 0 calls fn immediately', () => {
  let called = false;
  const result = fx.curryN(0, () => { called = true; return 42; });
  assert.strictEqual(result, 42);
  assert.strictEqual(called, true);
});

// === Branch coverage: overArgs line 392 (transforms[i] truthy) ===
// When there are more args than transforms, the extra args pass through unchanged

test('overArgs with more args than transforms', () => {
  const add1 = x => x + 1;
  // Only 1 transform but 3 args — args[1] and args[2] pass through unchanged
  const fn = (a, b, c) => a + b + c;
  const result = fx.overArgs(fn, [add1])(10, 20, 30);
  // (10+1) + 20 + 30 = 61
  assert.strictEqual(result, 61);
});

test('overArgs with empty transforms array', () => {
  const fn = (a, b) => a + b;
  const result = fx.overArgs(fn, [])(5, 10);
  assert.strictEqual(result, 15);
});

// === Branch coverage: debounce trailingEdge lines 153-154 (trailing && !lastArgs → return undefined) ===
// This path fires when trailingEdge is called but there are no pending args

test('debounce trailingEdge returns undefined when no pending args', async () => {
  let callCount = 0;
  const debounced = fx.debounce(() => { callCount++; }, 30, { trailing: true });
  // Call and let timer fire normally
  debounced();
  await new Promise(r => setTimeout(r, 60));
  assert.strictEqual(callCount, 1);

  // Now manually flush — trailingEdge will be called again but lastArgs is null
  const result = debounced.flush();
  assert.strictEqual(result, undefined);
  assert.strictEqual(callCount, 1); // fn not called again
});

// === Debounce: lastCallTime === undefined in shouldInvoke ===
// shouldInvoke is called from timerExpired. On first call, lastCallTime is set.
// But if we use leading:false, trailing:false, the function is never invoked
// and trailingEdge returns undefined. The shouldInvoke lastCallTime === undefined
// branch is a defensive guard — we can attempt to hit it via debounce with
// leading:false trailing:false which never sets up a timer

test('debounce with leading:false trailing:false returns undefined', () => {
  const debounced = fx.debounce(() => 42, 50, { leading: false, trailing: false });
  const result = debounced('test');
  assert.strictEqual(result, undefined);
});

// === CLI integration tests (cli.js currently has ZERO coverage) ===

describe('CLI integration', () => {
  test('CLI --version flag', () => {
    const output = execFileSync('node', [cliPath, '--version'], { encoding: 'utf-8' });
    assert.match(output, /function-x v/);
  });

  test('CLI -V flag', () => {
    const output = execFileSync('node', [cliPath, '-V'], { encoding: 'utf-8' });
    assert.match(output, /function-x v/);
  });

  test('CLI version command', () => {
    const output = execFileSync('node', [cliPath, 'version'], { encoding: 'utf-8' });
    assert.match(output, /function-x v/);
  });

  test('CLI help command', () => {
    const output = execFileSync('node', [cliPath, 'help'], { encoding: 'utf-8' });
    assert.match(output, /function-x/);
    assert.match(output, /Commands:/);
    assert.match(output, /demo/);
    assert.match(output, /Currying/);
  });

  test('CLI no args runs demo', () => {
    const output = execFileSync('node', [cliPath], { encoding: 'utf-8' });
    assert.match(output, /function-x Demo/);
  });

  test('CLI unknown command exits 1', () => {
    assert.throws(() => {
      execFileSync('node', [cliPath, 'unknown-command'], { encoding: 'utf-8' });
    }, { status: 1 });
  });

  test('CLI demo shows key functions', () => {
    const output = execFileSync('node', [cliPath, 'demo'], { encoding: 'utf-8' });
    assert.match(output, /Currying/);
    assert.match(output, /Memoization/);
    assert.match(output, /Throttling/);
    assert.match(output, /Once/);
  });
});
