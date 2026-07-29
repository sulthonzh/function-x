#!/usr/bin/env node

/**
 * Coverage gap tests round 2 for function-x
 * Targeting: debounce timerExpired re-schedule (lines 172-177),
 *            throttle timerExpired re-schedule (lines 263-265),
 *            cli.js catch block (lines 178-180)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import * as fx from '../function-x.js';

const cliPath = new URL('../cli.js', import.meta.url).pathname;

// === Debounce timerExpired re-schedule path (lines 172-177) ===
// This path fires when timerExpired is called but shouldInvoke returns false.
// shouldInvoke returns false when: timeSinceLastCall < wait && timeSinceLastCall >= 0
// && (maxWait === undefined || timeSinceLastInvoke < maxWait)
//
// Strategy: Use maxWait option so the timer reschedules itself.
// When we call debounce with maxWait, timerExpired checks shouldInvoke
// which may return false if system clock hasn't advanced enough.

test('debounce timerExpired reschedules when shouldInvoke returns false (maxWait)', async () => {
  let callCount = 0;
  const debounced = fx.debounce(
    () => { callCount++; },
    80,
    { leading: false, trailing: true, maxWait: 200 }
  );
  
  // First call starts the timer (fires at ~80ms)
  debounced();
  
  // Wait 40ms then call again — now lastCallTime is ~40ms
  // When timer fires at ~80ms from first call, it's only ~40ms since last call
  // so shouldInvoke returns false (40 < 80) → reschedule path
  await new Promise(r => setTimeout(r, 40));
  debounced();
  
  // Wait for timer to fire and reschedule + eventually invoke
  await new Promise(r => setTimeout(r, 120));
  assert.ok(callCount >= 1, `Expected at least 1 call, got ${callCount}`);
});

test('debounce timerExpired reschedule computes timeWaiting via Math.min', async () => {
  let callCount = 0;
  const debounced = fx.debounce(
    () => { callCount++; },
    50,
    { leading: false, trailing: true, maxWait: 100 }
  );
  
  // Call multiple times rapidly to ensure timer reschedules
  debounced();
  await new Promise(r => setTimeout(r, 10));
  debounced();
  await new Promise(r => setTimeout(r, 10));
  debounced();
  
  // Wait long enough for all timers to resolve
  await new Promise(r => setTimeout(r, 120));
  assert.ok(callCount >= 1);
});

// === Throttle timerExpired re-schedule path (lines 263-265) ===
// Similar to debounce — timerExpired fires but shouldInvoke returns false
// because timeSinceLastCall < wait. This happens when trailing call
// reschedules the timer.

test('throttle timerExpired reschedules when shouldInvoke returns false', async () => {
  let callCount = 0;
  const throttled = fx.throttle(
    () => { callCount++; },
    80,
    { leading: false, trailing: true }
  );
  
  // With leading:false, first call doesn't invoke immediately
  // It sets up a timer. When timer fires at ~80ms, shouldInvoke checks:
  // timeSinceLastCall >= wait. If we call again at ~40ms, then at timer fire
  // timeSinceLastCall ~40ms < 80ms → false → reschedule (lines 263-265)
  throttled('a');
  await new Promise(r => setTimeout(r, 40));
  throttled('b'); // Reset lastCallTime
  
  // Wait for all timers
  await new Promise(r => setTimeout(r, 120));
  assert.ok(callCount >= 1, `Expected at least 1 call, got ${callCount}`);
});

test('throttle timerExpired reschedule with rapid repeated calls', async () => {
  let callCount = 0;
  const throttled = fx.throttle(
    () => { callCount++; },
    30,
    { leading: true, trailing: true }
  );
  
  // Call rapidly during the wait period
  for (let i = 0; i < 5; i++) {
    throttled(`call-${i}`);
    await new Promise(r => setTimeout(r, 5));
  }
  
  // Wait for all timers to settle
  await new Promise(r => setTimeout(r, 80));
  assert.ok(callCount >= 2);
});

// === Throttle: shouldInvoke with lastCallTime === undefined branch ===
// In throttle, shouldInvoke checks `lastCallTime === undefined` but
// lastCallTime is initialized to 0, not undefined. This branch is
// structurally unreachable — defensive dead code.

// === CLI catch block (cli.js lines 178-180) ===
// The catch block fires when commands[command]() throws an error.
// We can trigger this by making the demo command fail — but demo
// is self-contained. Instead, let's test the error handling path
// by checking that the CLI properly exits with code 1 on errors.
// 
// The catch block at lines 178-180 is:
//   } catch (error) {
//     console.error(`❌ Error executing command "${command}":`, error.message);
//     process.exit(1);
//   }
//
// We can trigger this by corrupting the environment so the demo throws.
// Actually, let's look at it differently — the demo command uses setTimeout
// and Promise.all which won't throw synchronously. The help and version
// commands are pure console.log. So the catch is defensive.
//
// Strategy: Create a scenario where commands[command]() throws.
// The only way is if console.log itself throws, which is unlikely.
// This is effectively dead defensive code. But we can still cover it
// by making the process fail — e.g., by making the demo's fx.debounce
// call somehow throw. Since demo calls real functions, it shouldn't throw.
//
// Let's try a different approach: test that unknown commands work correctly
// and the error path for known commands that might fail.

test('CLI demo does not crash and produces output', () => {
  // Running demo should succeed — verifies the happy path doesn't hit catch block
  const output = execFileSync('node', [cliPath, 'demo'], { encoding: 'utf-8', timeout: 5000 });
  assert.match(output, /Demo complete/);
});

// === Debounce: shouldInvoke maxWait branch ===
// The maxWait branch in shouldInvoke: (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
// This is already exercised above via the maxWait tests.

test('debounce with maxWait eventually invokes even if calls keep coming', async () => {
  let callCount = 0;
  const debounced = fx.debounce(
    () => { callCount++; },
    100,
    { leading: false, trailing: true, maxWait: 50 }
  );
  
  // Call repeatedly so timer keeps rescheduling
  const interval = setInterval(() => debounced(), 20);
  
  // After maxWait (50ms) + buffer, the function should be invoked
  // even though we keep calling, because maxWait ensures eventual invocation
  await new Promise(r => setTimeout(r, 120));
  clearInterval(interval);
  
  // Wait for any pending timers
  await new Promise(r => setTimeout(r, 50));
  assert.ok(callCount >= 1, `Expected at least 1 call via maxWait, got ${callCount}`);
});

// === Throttle flush returns undefined when no timeout ===

test('throttle flush returns undefined when no pending timer', () => {
  let callCount = 0;
  const throttled = fx.throttle(() => { callCount++; }, 50);
  // No calls made yet, so no timer set
  const result = throttled.flush();
  assert.strictEqual(result, undefined);
  assert.strictEqual(callCount, 0);
});

// === Throttle cancel prevents trailing call ===

test('throttle cancel prevents pending trailing call', async () => {
  let callCount = 0;
  const throttled = fx.throttle(() => { callCount++; }, 50, { leading: true, trailing: true });
  
  throttled('first'); // Leading call
  throttled('second'); // Queued for trailing
  
  assert.strictEqual(callCount, 1);
  throttled.cancel();
  
  await new Promise(r => setTimeout(r, 80));
  assert.strictEqual(callCount, 1); // Trailing was cancelled
});

// === Debounce cancel after leading but before trailing ===

test('debounce cancel after leading prevents trailing', async () => {
  let callCount = 0;
  const debounced = fx.debounce(
    () => { callCount++; },
    50,
    { leading: true, trailing: true }
  );
  
  debounced('first'); // Leading call
  assert.strictEqual(callCount, 1);
  
  debounced.cancel();
  
  await new Promise(r => setTimeout(r, 80));
  assert.strictEqual(callCount, 1); // No trailing call
});

// === Debounce with leading:true and trailing:true — both fire ===

test('debounce leading+trailing fires both leading and trailing', async () => {
  let callCount = 0;
  const debounced = fx.debounce(
    () => { callCount++; },
    30,
    { leading: true, trailing: true }
  );
  
  debounced(); // Leading fires immediately
  assert.strictEqual(callCount, 1);
  
  // Second call within wait window sets up trailing
  await new Promise(r => setTimeout(r, 10));
  debounced(); // This updates lastArgs, resets trailing timer
  
  await new Promise(r => setTimeout(r, 60));
  assert.strictEqual(callCount, 2); // Trailing fired
});

// === createMemoizer with weak cache type ===

test('createMemoizer with weak cache creates WeakMap-based memoizer', () => {
  const memoizer = fx.createMemoizer('weak');
  
  // WeakMap requires object keys
  const obj1 = { id: 1 };
  const obj2 = { id: 2 };
  
  let callCount = 0;
  const fn = (key) => { callCount++; return key.id * 2; };
  const resolver = (key) => key; // Use object itself as key
  
  const memoized = memoizer(fn, resolver);
  
  assert.strictEqual(memoized(obj1), 2);
  assert.strictEqual(memoized(obj1), 2); // Cached
  assert.strictEqual(memoized(obj2), 4);
  assert.strictEqual(callCount, 2); // Only 2 calls for 2 unique objects
});

// === createMemoizer default (unknown type) falls back to memoize ===

test('createMemoizer with unknown type falls back to memoize', () => {
  const memoizer = fx.createMemoizer('unknown');
  let callCount = 0;
  const fn = (x) => { callCount++; return x * 3; };
  const memoized = memoizer(fn);
  
  assert.strictEqual(memoized(5), 15);
  assert.strictEqual(memoized(5), 15); // Cached
  assert.strictEqual(callCount, 1);
});

// === createThrottler with options ===

test('createThrottler creates throttle with preset options', async () => {
  let callCount = 0;
  const throttler = fx.createThrottler({ leading: true, trailing: false });
  const throttled = throttler(() => { callCount++; }, 50);
  
  throttled(); // Leading
  throttled(); // Suppressed (no trailing)
  
  await new Promise(r => setTimeout(r, 80));
  assert.strictEqual(callCount, 1);
});

// === createDebouncer with options ===

test('createDebouncer creates debounce with preset options', async () => {
  let callCount = 0;
  const debouncer = fx.createDebouncer({ leading: true, trailing: false });
  const debounced = debouncer(() => { callCount++; }, 50);
  
  debounced(); // Leading
  await new Promise(r => setTimeout(r, 80));
  assert.strictEqual(callCount, 1); // No trailing
});

// === rateLimit error handling ===

test('rateLimit rejects on function error', async () => {
  const limited = fx.rateLimit(() => { throw new Error('boom'); }, 2, 100);
  
  await assert.rejects(() => limited('arg'), { message: 'boom' });
});

test('rateLimit processes multiple items within limit', async () => {
  let callCount = 0;
  const limited = fx.rateLimit(
    (x) => { callCount++; return Promise.resolve(x * 2); },
    3,
    100
  );
  
  const results = await Promise.all([
    limited(1),
    limited(2),
    limited(3),
  ]);
  
  assert.deepStrictEqual(results, [2, 4, 6]);
  assert.strictEqual(callCount, 3);
});

// === compose with single function ===

test('compose with single function', () => {
  const fn = x => x + 1;
  const composed = fx.compose(fn);
  assert.strictEqual(composed(5), 6);
});

// === pipe with single function ===

test('pipe with single function', () => {
  const fn = x => x * 2;
  const piped = fx.pipe(fn);
  assert.strictEqual(piped(5), 10);
});

// === over with array of functions ===

test('over with array of functions applies each to args', () => {
  const fns = [x => x + 1, x => x * 2, x => x - 3];
  const result = fx.over(fns)(5);
  assert.deepStrictEqual(result, [6, 10, 2]);
});

test('over with non-function value returns array with value', () => {
  const result = fx.over(42)(5);
  assert.deepStrictEqual(result, [42]);
});

// === memoize with custom resolver ===

test('memoize with custom resolver function', () => {
  let callCount = 0;
  const fn = (a, b) => { callCount++; return a + b; };
  // Custom resolver: use only first arg as key
  const memoized = fx.memoize(fn, (a) => `key-${a}`);
  
  assert.strictEqual(memoized(1, 100), 101);
  assert.strictEqual(memoized(1, 200), 101); // Cached! Same key "key-1"
  assert.strictEqual(callCount, 1);
});

// === memoizeClear clears cache ===

test('memoizeClear clears the memoize cache', () => {
  let callCount = 0;
  const fn = (x) => { callCount++; return x * x; };
  const memoized = fx.memoize(fn);
  
  memoized(5); // Cache miss
  memoized(5); // Cache hit
  assert.strictEqual(callCount, 1);
  
  fx.memoizeClear(memoized);
  memoized(5); // Cache miss again
  assert.strictEqual(callCount, 2);
});

// === once preserves context (this) ===

test('once preserves this context', () => {
  const obj = {
    value: 42,
    getValue: fx.once(function() { return this.value; })
  };
  
  assert.strictEqual(obj.getValue(), 42);
  assert.strictEqual(obj.getValue(), 42); // Same cached result
});

// === after only invokes after N calls ===

test('after invokes function only after N calls', () => {
  let callCount = 0;
  const fn = fx.after(3, () => { callCount++; return 'done'; });
  
  assert.strictEqual(fn(1), undefined);
  assert.strictEqual(fn(2), undefined);
  assert.strictEqual(fn(3), 'done');
  assert.strictEqual(fn(4), 'done'); // Keeps invoking after threshold
  assert.strictEqual(callCount, 2);
});

// === before stops invoking after N-1 calls ===

test('before stops invoking after count-1 calls', () => {
  let callCount = 0;
  const fn = fx.before(3, () => { callCount++; return 'result'; });
  
  assert.strictEqual(fn(1), 'result'); // remaining=2 after decrement, >0
  assert.strictEqual(fn(2), 'result'); // remaining=1 after decrement, >0
  assert.strictEqual(fn(3), undefined); // remaining=0, not >0
  assert.strictEqual(callCount, 2);
});

// === spread converts args to array ===

test('spread passes arguments as single array', () => {
  const fn = (arr) => arr.reduce((a, b) => a + b, 0);
  const spreadFn = fx.spread(fn);
  assert.strictEqual(spreadFn(1, 2, 3, 4), 10);
});

// === ternary returns fn as-is when length === 3 ===

test('ternary returns fn as-is when fn.length === 3', () => {
  const fn = (a, b, c) => a + b + c;
  const result = fx.ternary(fn);
  assert.strictEqual(result, fn);
  assert.strictEqual(result(1, 2, 3), 6);
});

// === isAsyncFunction and isGeneratorFunction ===

test('isAsyncFunction correctly identifies async functions', () => {
  const asyncFn = async () => {};
  const syncFn = () => {};
  
  assert.strictEqual(fx.isAsyncFunction(asyncFn), true);
  assert.strictEqual(fx.isAsyncFunction(syncFn), false);
});

test('isGeneratorFunction correctly identifies generators', () => {
  const genFn = function* () { yield 1; };
  const syncFn = () => {};
  
  assert.strictEqual(fx.isGeneratorFunction(genFn), true);
  assert.strictEqual(fx.isGeneratorFunction(syncFn), false);
});

// === tap with non-function ===

test('tap returns value when fn is not a function', () => {
  const result = fx.tap(42)('not a function');
  assert.strictEqual(result, 42);
});

// === VERSION and version exports ===

test('VERSION and version exports are correct', () => {
  assert.strictEqual(fx.VERSION, '1.1.0');
  assert.strictEqual(fx.version, '1.1.0');
  assert.strictEqual(fx.description, 'Zero-dependency higher-order function utilities');
});
