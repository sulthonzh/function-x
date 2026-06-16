#!/usr/bin/env node

/**
 * CLI for function-x - Higher-order function utilities
 */

import * as fx from './function-x.js';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const commands = {
  demo: () => {
    console.log('🎯 function-x Demo - Higher-order Function Utilities');
    console.log('=====================================================\n');
    
    // Identity and utilities
    console.log('📌 Identity & Utilities:');
    console.log(`  fx.identity(42) =`, fx.identity(42));
    console.log(`  fx.constant(5)() =`, fx.constant(5)());
    console.log(`  fx.negate(x => x > 0)(-1) =`, fx.negate(x => x > 0)(-1));
    console.log();
    
    // Currying
    console.log('🔥 Currying:');
    const add = (a, b) => a + b;
    const add5 = fx.curry(add, 2)(5);
    console.log(`  fx.curry((a,b) => a+b, 2)(5) =`, add5);
    
    const multiply = (a, b, c) => a * b * c;
    const multiplyBy2And3 = fx.curryN(3, multiply)(2, 3);
    console.log(`  fx.curryN(3, multiply)(2,3)(4) =`, multiplyBy2And3(4));
    console.log();
    
    // Partial application
    console.log('⚡ Partial Application:');
    const subtract = (a, b) => a - b;
    const subtractFrom10 = fx.partial(subtract, 10);
    console.log(`  fx.partial((a,b) => a-b, 10)(5) =`, subtractFrom10(5));
    
    const divide = (a, b) => a / b;
    const divideBy2 = fx.partialRight(divide, 2);
    console.log(`  fx.partialRight((a,b) => a/b, 2)(10) =`, divideBy2(10));
    console.log();
    
    // Composition
    console.log('🔄 Function Composition:');
    const add1 = x => x + 1;
    const multiply2 = x => x * 2;
    const subtract3 = x => x - 3;
    
    const composed = fx.compose(subtract3, multiply2, add1);
    console.log(`  fx.compose(subtract3, multiply2, add1)(5) =`, composed(5));
    
    const piped = fx.pipe(add1, multiply2, subtract3);
    console.log(`  fx.pipe(add1, multiply2, subtract3)(5) =`, piped(5));
    console.log();
    
    // Memoization
    console.log('💾 Memoization:');
    let callCount = 0;
    const slowSquare = x => {
      callCount++;
      return x * x;
    };
    
    const memoizedSquare = fx.memoize(slowSquare);
    console.log('  First call:', memoizedSquare(5), '(callCount:', callCount + ')');
    console.log('  Second call (cached):', memoizedSquare(5), '(callCount:', callCount + ')');
    console.log('  Different input:', memoizedSquare(3), '(callCount:', callCount + ')');
    console.log();
    
    // Debouncing
    console.log('⏱️  Debouncing (simulated):');
    let debounceCallCount = 0;
    const debouncedLog = fx.debounce((msg) => {
      debounceCallCount++;
      console.log(`  Debounced call #${debounceCallCount}: ${msg}`);
    }, 100);
    
    for (let i = 0; i < 3; i++) {
      setTimeout(() => debouncedLog(`Message ${i + 1}`), i * 50);
    }
    console.log('  Messages will be logged after debouncing completes...');
    console.log();
    
    // Throttling
    console.log('🚦 Throttling:');
    let throttleCallCount = 0;
    const throttledLog = fx.throttle((msg) => {
      throttleCallCount++;
      console.log(`  Throttled call #${throttleCallCount}: ${msg}`);
    }, 100);
    
    console.log('  Rapid calls (only first will execute immediately):');
    throttledLog('Call 1');
    throttledLog('Call 2');
    throttledLog('Call 3');
    console.log('  Other calls will be throttled...');
    console.log();
    
    // Once
    console.log('🔄 Once:');
    const onceFunc = fx.once(() => 'This will only execute once!');
    console.log('  First call:', onceFunc());
    console.log('  Second call:', onceFunc());
    console.log();
    
    // Rate limiting
    console.log('🚧 Rate Limiting:');
    let rateCount = 0;
    const rateLimited = fx.rateLimit((msg) => {
      rateCount++;
      console.log(`  Rate limited call #${rateCount}: ${msg}`);
      return Promise.resolve(rateCount);
    }, 3, 1000); // 3 calls per second
    
    console.log('  Making 5 rapid calls:');
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(rateLimited(`Request ${i + 1}`));
    }
    console.log('  Resolving...');
    Promise.all(promises).then(results => {
      console.log('  Results:', results);
    });
    console.log();
    
    console.log('✅ Demo complete! Try: function-x --help for more commands.');
  },
  
  help: () => {
    console.log(`🎯 function-x v${pkg.version} - Higher-order Function Utilities`);
    console.log('=============================================================\n');
    console.log('Usage: function-x <command>\n');
    console.log('Commands:');
    console.log('  demo          Run interactive demo of all functions');
    console.log('  help          Show this help message');
    console.log('  version       Show version information');
    console.log('\nExample:');
    console.log('  function-x demo');
    console.log('');
    console.log('Functions available:');
    console.log('  Basic: identity, constant, noop, unary, binary, ternary, negate');
    console.log('  Currying: curry, curryN');
    console.log('  Partial: partial, partialRight');
    console.log('  Composition: compose, pipe');
    console.log('  Memoization: memoize, memoizeSync, memoizeClear');
    console.log('  Debouncing: debounce, debounceLeading, debounceTrailing, debounceBoth');
    console.log('  Throttling: throttle, throttleLeading, throttleTrailing, throttleBoth');
    console.log('  Rate limiting: rateLimit');
    console.log('  Utilities: once, after, before, spread, overArgs');
    console.log('  Factory: createMemoizer, createThrottler, createDebouncer');
  },
  
  version: () => {
    console.log(`function-x v${pkg.version}`);
    console.log('Zero-dependency higher-order function utilities');
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'demo';

if (commands[command]) {
  try {
    commands[command]();
  } catch (error) {
    console.error(`❌ Error executing command "${command}":`, error.message);
    process.exit(1);
  }
} else {
  console.log(`❌ Unknown command: ${command}`);
  console.log('Use "function-x help" to see available commands.');
  process.exit(1);
}