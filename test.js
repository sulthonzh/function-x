#!/usr/bin/env node

/**
 * Test suite for function-x - Higher-order function utilities
 */

import * as fx from './function-x.js';
import assert from 'assert';

// Test helpers
const test = (name, fn) => {
  try {
    fn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    throw error;
  }
};

const throws = (name, fn, expectedError) => {
  try {
    fn();
    throw new Error(`Expected to throw ${expectedError}`);
  } catch (error) {
    if (error.message.includes(expectedError)) {
      console.log(`✅ ${name}`);
    } else {
      throw new Error(`${name}: Expected ${expectedError}, got ${error.message}`);
    }
  }
};

// Basic identity and utility functions
test('identity function', () => {
  assert.strictEqual(fx.identity(42), 42);
  assert.strictEqual(fx.identity('hello'), 'hello');
  assert.strictEqual(fx.identity(null), null);
});

test('constant function', () => {
  const const5 = fx.constant(5);
  assert.strictEqual(const5(), 5);
  assert.strictEqual(const5(), 5);
  assert.strictEqual(const5(), 5);
});

test('noop function', () => {
  assert.strictEqual(fx.noop(), undefined);
  assert.strictEqual(fx.noop(1, 2, 3), undefined);
});

test('unary function', () => {
  const add1 = x => x + 1;
  const unaryAdd1 = fx.unary(add1);
  assert.strictEqual(unaryAdd1(5), 6);
  
  const binaryAdd = (x, y) => x + y;
  const unaryBinaryAdd = fx.unary(binaryAdd);
  assert.strictEqual(unaryBinaryAdd(5), NaN); // 5 + undefined = NaN
});

test('binary function', () => {
  const add = (x, y) => x + y;
  const binaryAdd = fx.binary(add);
  assert.strictEqual(binaryAdd(3, 4), 7);
});

test('negate function', () => {
  const isPositive = x => x > 0;
  const isNegative = fx.negate(isPositive);
  assert.strictEqual(isPositive(5), true);
  assert.strictEqual(isNegative(5), false);
  assert.strictEqual(isPositive(-5), false);
  assert.strictEqual(isNegative(-5), true);
});

test('tap function', () => {
  const results = [];
  const tapped = fx.tap(42)(x => results.push(x));
  assert.strictEqual(tapped, 42);
  assert.deepStrictEqual(results, [42]);
});

test('over function', () => {
  const add1 = x => x + 1;
  const result = fx.over(add1)(5);
  assert.strictEqual(result, 6);
});

test('function type checking', () => {
  assert.strictEqual(fx.isFunction(() => {}), true);
  assert.strictEqual(fx.isFunction(function() {}), true);
  assert.strictEqual(fx.isFunction(async () => {}), true);
  assert.strictEqual(fx.isFunction(function*() {}), true);
  assert.strictEqual(fx.isFunction(42), false);
  assert.strictEqual(fx.isFunction('hello'), false);
});

// Currying
test('curry function', () => {
  const add = (a, b) => a + b;
  const curriedAdd = fx.curry(add);
  assert.strictEqual(curriedAdd(2, 3), 5);
  assert.strictEqual(curriedAdd(2)(3), 5);
});

test('curryN function', () => {
  const multiply = (a, b, c) => a * b * c;
  const multiply2 = fx.curryN(2, multiply);
  assert.strictEqual(multiply2(2, 3, 4), 24); // Passes all args to function
  // Note: curryN with arity 2 for a 3-arg function is unusual, this test shows the behavior
});

// Partial application
test('partial function', () => {
  const subtract = (a, b) => a - b;
  const subtractFrom10 = fx.partial(subtract, 10);
  assert.strictEqual(subtractFrom10(3), 7);
});

test('partialRight function', () => {
  const divide = (a, b) => a / b;
  const divideBy2 = fx.partialRight(divide, 2);
  assert.strictEqual(divideBy2(10), 5);
});

// Function composition
test('compose function', () => {
  const add1 = x => x + 1;
  const multiply2 = x => x * 2;
  const composed = fx.compose(multiply2, add1);
  assert.strictEqual(composed(3), 8); // (3 + 1) * 2 = 8
});

test('pipe function', () => {
  const add1 = x => x + 1;
  const multiply2 = x => x * 2;
  const piped = fx.pipe(add1, multiply2);
  assert.strictEqual(piped(3), 8); // (3 + 1) * 2 = 8
});

// Memoization
test('memoize function', () => {
  let callCount = 0;
  const expensive = x => {
    callCount++;
    return x * x;
  };
  
  const memoized = fx.memoize(expensive);
  assert.strictEqual(memoized(5), 25);
  assert.strictEqual(callCount, 1);
  assert.strictEqual(memoized(5), 25); // Should be cached
  assert.strictEqual(callCount, 1); // Count shouldn't increase
  assert.strictEqual(memoized(3), 9);
  assert.strictEqual(callCount, 2);
});

test('memoizeClear function', () => {
  let callCount = 0;
  const expensive = x => {
    callCount++;
    return x * x;
  };
  
  const memoized = fx.memoize(expensive);
  memoized(5);
  assert.strictEqual(callCount, 1);
  
  fx.memoizeClear(memoized);
  memoized(5);
  assert.strictEqual(callCount, 2); // Should call again after clear
});

// Debouncing
test('debounce function', (done) => {
  let callCount = 0;
  const debounced = fx.debounce(() => {
    callCount++;
    assert.strictEqual(callCount, 1);
    done();
  }, 100);
  
  debounced();
  debounced();
  debounced();
});

test('debounceLeading function', (done) => {
  let callCount = 0;
  const debounced = fx.debounceLeading(() => {
    callCount++;
    assert.strictEqual(callCount, 1);
    done();
  }, 100);
  
  debounced();
  assert.strictEqual(callCount, 1); // Should call immediately
  debounced(); // Should not call again
});

// Throttling
test('throttle function', (done) => {
  let callCount = 0;
  const throttled = fx.throttle(() => {
    callCount++;
    if (callCount === 1) {
      assert.strictEqual(callCount, 1);
      done();
    }
  }, 100);
  
  throttled(); // Called immediately
  throttled(); // Should be throttled
  throttled(); // Should be throttled
});

test('throttleLeading function', (done) => {
  let callCount = 0;
  const throttled = fx.throttleLeading(() => {
    callCount++;
    assert.strictEqual(callCount, 1);
    done();
  }, 100);
  
  throttled(); // Should call immediately
  throttled(); // Should be throttled
});

// Rate limiting
test('rateLimit function', async () => {
  let callCount = 0;
  const rateLimited = fx.rateLimit((x) => {
    callCount++;
    return x;
  }, 2, 500); // 2 calls per 500ms
  
  const results = await Promise.all([
    rateLimited(1),
    rateLimited(2),
    rateLimited(3), // This should be delayed
    rateLimited(4)  // This should be delayed
  ]);
  
  assert.strictEqual(callCount, 2); // Only 2 calls should have executed
  assert.deepStrictEqual(results, [1, 2, 3, 4]); // All should resolve eventually
});

// Once
test('once function', () => {
  let callCount = 0;
  const onceFn = fx.once(() => {
    callCount++;
    return 'called';
  });
  
  assert.strictEqual(onceFn(), 'called');
  assert.strictEqual(callCount, 1);
  assert.strictEqual(onceFn(), 'called'); // Returns cached result
  assert.strictEqual(callCount, 1); // Count doesn't increase
});

// After
test('after function', () => {
  let callCount = 0;
  const afterFn = fx.after(3, () => {
    callCount++;
    return 'called';
  });
  
  assert.strictEqual(afterFn(), undefined);
  assert.strictEqual(callCount, 0);
  assert.strictEqual(afterFn(), undefined);
  assert.strictEqual(callCount, 0);
  assert.strictEqual(afterFn(), 'called');
  assert.strictEqual(callCount, 1);
  assert.strictEqual(afterFn(), 'called'); // Returns cached result
});

// Before
test('before function', () => {
  let callCount = 0;
  const beforeFn = fx.before(3, () => {
    callCount++;
    return 'called';
  });
  
  assert.strictEqual(beforeFn(), 'called');
  assert.strictEqual(callCount, 1);
  assert.strictEqual(beforeFn(), 'called');
  assert.strictEqual(callCount, 2);
  assert.strictEqual(beforeFn(), undefined); // Won't call after limit reached
  assert.strictEqual(callCount, 2); // Count doesn't increase
});

// Spread
test('spread function', () => {
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  const spreadSum = fx.spread(sum);
  assert.strictEqual(spreadSum([1, 2, 3, 4]), 10);
});

// OverArgs
test('overArgs function', () => {
  const add = (a, b) => a + b;
  const add1 = x => x + 1;
  const add2 = x => x + 2;
  
  const overAdd = fx.overArgs(add, [add1, add2]);
  assert.strictEqual(overAdd(1, 1), 6); // (1+1) + (1+2) = 2 + 3 = 5
});

// Factory functions
test('createMemoizer factory', () => {
  let callCount = 0;
  const expensive = x => {
    callCount++;
    return x * x;
  };
  
  const memoized = fx.createMemoizer('map')(expensive);
  assert.strictEqual(memoized(5), 25);
  assert.strictEqual(callCount, 1);
  assert.strictEqual(memoized(5), 25); // Cached
  assert.strictEqual(callCount, 1);
});

// Test async functions
test('isAsyncFunction', () => {
  assert.strictEqual(fx.isAsyncFunction(async () => {}), true);
  assert.strictEqual(fx.isAsyncFunction(function*() {}), false);
  assert.strictEqual(fx.isAsyncFunction(() => {}), false);
});

// Error handling
test('memoize with custom resolver', () => {
  let callCount = 0;
  const expensive = x => {
    callCount++;
    return x * 2;
  };
  
  const customResolver = (x) => `key-${x}`;
  const memoized = fx.memoize(expensive, customResolver);
  
  assert.strictEqual(memoized(5), 10);
  assert.strictEqual(callCount, 1);
  assert.strictEqual(memoized(6), 12);
  assert.strictEqual(callCount, 2);
  assert.strictEqual(memoized(5), 10); // Cached
  assert.strictEqual(callCount, 2);
});

console.log('🎉 All tests passed!');