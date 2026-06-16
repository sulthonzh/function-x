import * as fx from './function-x.js';

console.log('Testing negate function...');

// Test with boolean values
console.log('negate(true):', fx.negate(true));
console.log('negate(false):', fx.negate(false));

// Test with functions
console.log('negate(() => true):', fx.negate(() => true));
console.log('negate(() => false):', fx.negate(() => false));

// Test the actual implementation
const currentNegate = fx.negate;
console.log('Current negate implementation:', currentNegate.toString());