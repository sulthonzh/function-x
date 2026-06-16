import * as fx from './function-x.js';

const add1 = x => x + 1;
const multiply2 = x => x * 2;

console.log('Testing compose...');
console.log('add1(3):', add1(3));
console.log('multiply2(3):', multiply2(3));

const composed = fx.compose(multiply2, add1);
console.log('composed(3):', composed(3));

// Let's trace step by step
const step1 = add1(3);
console.log('Step 1 - add1(3):', step1);

const step2 = multiply2(step1);
console.log('Step 2 - multiply2(step1):', step2);