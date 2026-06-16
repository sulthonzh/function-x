import * as fx from './function-x.js';

console.log('Testing debounceLeading...');

// Test case that should call immediately
let callCount = 0;
const debounced = fx.debounceLeading(() => {
  callCount++;
  console.log('Function called! Count:', callCount);
  return callCount;
}, 100);

console.log('Calling debounced function...');
const result1 = debounced();
console.log('Result 1:', result1);

setTimeout(() => {
  console.log('Call count after 100ms:', callCount);
  const result2 = debounced();
  console.log('Result 2:', result2);
  console.log('Call count after second call:', callCount);
}, 150);