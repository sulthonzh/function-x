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
  assert.strictEqual(const5(10, 20, 'test'), 5);
});

test('noop function', () => {
  assert.strictEqual(fx.noop(), undefined);
  assert.strictEqual(fx.noop('test', 42), undefined);
});

test('unary function', () => {
  const add10 = fx.unary(x => x + 10);
  assert.strictEqual(add10(5), 15);
  
  // Test that it ignores extra arguments
  assert.strictEqual(add10(5, 10, 20), 15);
});

test('binary function', () => {
  const multiply = fx.binary((a, b) => a * b);
  assert.strictEqual(multiply(3, 4), 12);
  
  // Test that it ignores extra arguments
  assert.strictEqual(multiply(3, 4, 5, 6), 12);
});

test('negate function', () => {
  assert.strictEqual(fx.negate(true), false);
  assert.strictEqual(fx.negate(false), true);
});

test('tap function', () => {
  let sideEffectValue = null;
  const result = fx.tap(42, value => {
    sideEffectValue = value;
  });
  assert.strictEqual(sideEffectValue, 42);
  assert.strictEqual(result, 42);
});

test('over function', () => {
  const toUpper = x => x.toUpperCase();
  const toLower = x => x.toLowerCase();
  
  const result1 = fx.over(toUpper, 'Hello');
  assert.strictEqual(result1, 'HELLO');
  
  const result2 = fx.over(toLower, 'Hello');
  assert.strictEqual(result2, 'hello');
  
  // Test with array of functions
  const overText = fx.over([toUpper, toLower], 'Hello');
  assert.deepStrictEqual(overText, ['HELLO', 'hello']);
});

// Function type checking
test('function type checking', () => {
  assert.strictEqual(fx.isFunction(() => {}), true);
  assert.strictEqual(fx.isFunction({}), false);
  assert.strictEqual(fx.isFunction(42), false);
  assert.strictEqual(fx.isFunction('string'), false);
  assert.strictEqual(fx.isFunction(null), false);
  assert.strictEqual(fx.isFunction(undefined), false);
});

// Currying
test('curry function', () => {
  const add3 = (a, b, c) => a + b + c;
  const curriedAdd = fx.curry(add3);
  
  assert.strictEqual(curriedAdd(1, 2, 3), 6);
  assert.strictEqual(curriedAdd(1)(2, 3), 6);
  assert.strictEqual(curriedAdd(1, 2)(3), 6);
  assert.strictEqual(curriedAdd(1)(2)(3), 6);
});

test('curryN function', () => {
  const add = (a, b) => a + b;
  const add2 = fx.curryN(2, add);
  
  assert.strictEqual(add2(1, 2), 3); // Passes all args to function
  assert.strictEqual(add2(1)(2), 3); // Can curry with partial application
  assert.strictEqual(add2(1, 2, 3), 3); // Ignores extra args
});

test('partial function', () => {
  const add = (a, b, c) => a + b + c;
  const add5 = fx.partial(add, 5);
  
  assert.strictEqual(add5(10, 15), 30);
  assert.strictEqual(add5(10, 15, 20), 30); // Ignores extra args after arity
});

test('partialRight function', () => {
  const add = (a, b, c) => a + b + c;
  const addLast2 = fx.partialRight(add, 10, 20);
  
  assert.strictEqual(addLast2(5), 35);
  assert.strictEqual(addLast2(5, 100), 115); // Uses first arg only, ignores extra args
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
  const add = (a, b) => {
    callCount++;
    return a + b;
  };
  
  const memoizedAdd = fx.memoize(add);
  
  assert.strictEqual(memoizedAdd(1, 2), 3);
  assert.strictEqual(callCount, 1);
  
  assert.strictEqual(memoizedAdd(1, 2), 3);
  assert.strictEqual(callCount, 1); // Should not call again
});

test('memoizeClear function', () => {
  let callCount = 0;
  const add = (a, b) => {
    callCount++;
    return a + b;
  };
  
  const memoizedAdd = fx.memoize(add);
  
  assert.strictEqual(memoizedAdd(1, 2), 3);
  assert.strictEqual(callCount, 1);
  
  fx.memoizeClear(memoizedAdd);
  
  assert.strictEqual(memoizedAdd(1, 2), 3);
  assert.strictEqual(callCount, 2); // Should call again after clear
});

// Debouncing
test('debounce function', () => {
  return new Promise((resolve) => {
    let callCount = 0;
    const debounced = fx.debounce(() => {
      callCount++;
      assert.strictEqual(callCount, 1);
      resolve();
    }, 100);
    
    debounced();
    debounced();
    debounced();
    assert.strictEqual(callCount, 0); // Should not call immediately
  });
});

// Simple test for debounceLeading to check it calls immediately
test('debounceLeading function', () => {
  let callCount = 0;
  const debounced = fx.debounceLeading(() => {
    callCount++;
    return callCount;
  }, 100);
  
  const result = debounced();
  assert.strictEqual(callCount, 1); // Should call immediately
  assert.strictEqual(result, 1); // Should return the result
});

console.log('All tests completed!');