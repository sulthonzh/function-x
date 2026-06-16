import * as fx from './function-x.js';

console.log('Testing tap function...');

const results = [];
const tapped = fx.tap(42, x => results.push(x));
console.log('tapped result:', tapped);
console.log('results array:', results);
console.log('tapped === 42:', tapped === 42);