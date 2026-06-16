import * as fx from './function-x.js';

console.log('Testing curryN function...');

const multiply = (a, b, c) => {
  console.log('multiply called with:', a, b, c);
  return a * b * c;
};

const multiply2 = fx.curryN(2, multiply);

console.log('multiply2(2, 3):');
const result1 = multiply2(2, 3);
console.log('Result:', result1);

console.log('\nmultiply2(2)(3):');
const result2 = multiply2(2)(3);
console.log('Result:', result2);

// Show implementation
console.log('\ncurryN implementation:');
console.log(fx.curryN.toString());