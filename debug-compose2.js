import * as fx from './function-x.js';

const add1 = x => {
  console.log('add1 called with:', x, 'returning:', x + 1);
  return x + 1;
};

const multiply2 = x => {
  console.log('multiply2 called with:', x, 'returning:', x * 2);
  return x * 2;
};

console.log('Creating compose...');
const composed = fx.compose(multiply2, add1);
console.log('Calling composed(3)...');
const result = composed(3);
console.log('Final result:', result);