// Let's manually trace what compose should do
const identity = x => x;

const multiply2 = x => {
  console.log('multiply2 called with:', x);
  return x * 2;
};

const add1 = x => {
  console.log('add1 called with:', x);
  return x + 1;
};

// Simulate what fx.compose(multiply2, add1) should do
const fns = [multiply2, add1];

console.log('fns:', fns);

// Step 1: reduceRight starts with identity
let composed = identity;
console.log('Initial composed:', composed);

// Step 2: First iteration - multiply2
composed = (...args) => {
  console.log('First iteration: calling fn:', multiply2.name, 'with args:', args);
  const result = multiply2(...args);
  console.log('First iteration: calling composed with result:', result);
  return composed(result);
};
console.log('After first iteration:', composed);

// Step 3: Second iteration - add1  
composed = (...args) => {
  console.log('Second iteration: calling fn:', add1.name, 'with args:', args);
  const result = add1(...args);
  console.log('Second iteration: calling composed with result:', result);
  return composed(result);
};
console.log('After second iteration:', composed);

console.log('Final result:', composed(3));