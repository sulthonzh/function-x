import * as fx from './function-x.js';

console.log('Testing tap function...');

// Test with function
console.log('tap(42, x => console.log(x)):');
const result1 = fx.tap(42, x => {
  console.log('Side effect called with:', x);
});
console.log('Result:', result1);

// Test without function
console.log('\ntap(42):');
const result2 = fx.tap(42);
console.log('Result:', result2);

// Show the implementation
console.log('\nCurrent tap implementation:');
console.log(fx.tap.toString());