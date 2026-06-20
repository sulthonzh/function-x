/**
 * function-x - Zero-dependency higher-order function utilities
 * @version 1.1.0
 * @author Sulthonzh
 * @license MIT
 */

// Basic identity and utility functions
export const identity = x => x;
export const constant = x => () => x;
export const noop = () => {};
export const unary = fn => fn.length === 1 ? fn : x => fn(x);
export const binary = fn => fn.length === 2 ? fn : (x, y) => fn(x, y);
export const ternary = fn => fn.length === 3 ? fn : (x, y, z) => fn(x, y, z);
export const negate = (predicate) => (...args) => !predicate(...args);
export const tap = (value) => (fn) => {
  if (typeof fn === 'function') fn(value);
  return value;
};
export const over = (fn) => (...args) => {
  if (Array.isArray(fn)) {
    return fn.map(f => f(...args));
  }
  if (typeof fn === 'function') return fn(...args);
  return [fn]; // If not a function, return array with the value
};

// Function type checking
export const isFunction = f => typeof f === 'function';
export const isAsyncFunction = f => f.constructor && f.constructor.name === 'AsyncFunction';
export const isGeneratorFunction = f => f.constructor && f.constructor.name === 'GeneratorFunction';

// Currying
export const curry = (fn, arity = fn.length) => {
  return function curried(...args) {
    return args.length >= arity 
      ? fn(...args) 
      : (...nextArgs) => curried(...args, ...nextArgs);
  };
};

export const curryN = (arity, fn) => {
  if (arity === 0) return fn();
  if (arity === 1) return x => fn(x);
  
  return function curried(...args) {
    if (args.length >= arity) {
      return fn(...args);
    }
    return (...nextArgs) => {
      const combined = [...args, ...nextArgs];
      if (combined.length >= arity) {
        return fn(...combined);
      }
      return curryN(arity, fn)(...combined);
    };
  };
};

// Partial application
export const partial = (fn, ...presetArgs) => {
  return (...laterArgs) => fn(...presetArgs, ...laterArgs);
};

export const partialRight = (fn, ...presetArgs) => {
  return (...laterArgs) => fn(...laterArgs, ...presetArgs);
};

// Function composition
export const compose = (...fns) => {
  return function composed(...args) {
    let result = args[0];
    for (const fn of fns.reverse()) {
      result = fn(result);
    }
    return result;
  };
};

export const pipe = (...fns) => {
  return fns.reduce((piped, fn) => 
    (...args) => fn(piped(...args))
  , identity);
};

// Memoization
export const memoize = (fn, resolver = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  const memoized = function memoized(...args) {
    const key = resolver(...args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
  
  memoized.cache = cache;
  return memoized;
};

export const memoizeSync = (fn, resolver = (...args) => JSON.stringify(args)) => {
  const cache = new Map();
  
  const memoized = function memoized(...args) {
    const key = resolver(...args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
  
  memoized.cache = cache;
  return memoized;
};

export const memoizeClear = memoized => {
  memoized.cache.clear();
  return memoized;
};

// Debouncing
export const debounce = (fn, wait, options = {}) => {
  const { leading = false, trailing = true } = options;
  let timeoutId;
  let lastArgs;
  let lastThis;
  let lastCallTime;
  let lastInvokeTime = 0;
  
  const invokeFunc = (time) => {
    const args = lastArgs;
    const thisArg = lastThis;
    
    lastArgs = lastThis = timeoutId = null;
    lastInvokeTime = time;
    return fn.apply(thisArg, args || []);
  };
  
  const shouldInvoke = (time) => {
    const last = lastInvokeTime || 0;
    const timeSinceLastCall = time - last;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const { maxWait } = options;
    
    return (lastCallTime === undefined || 
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            (maxWait !== undefined && timeSinceLastInvoke >= maxWait));
  };
  
  const trailingEdge = (time) => {
    timeoutId = null;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = null;
    return undefined;
  };
  
  const timerExpired = () => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    
    const timeSinceLastCall = wait - (time - lastCallTime);
    const timeSinceLastInvoke = wait - (time - lastInvokeTime);
    const timeWaiting = Math.min(timeSinceLastCall, timeSinceLastInvoke);
    
    timeoutId = setTimeout(timerExpired, timeWaiting);
  };
  
  const debounced = function(...args) {
    const time = Date.now();
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    
    if (timeoutId === undefined) {
      if (leading) {
        return invokeFunc(time);
      }
      timeoutId = setTimeout(timerExpired, wait);
    }
    
    return undefined;
  };
  
  debounced.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    lastArgs = lastThis = lastCallTime = timeoutId = null;
  };
  
  debounced.flush = () => {
    if (timeoutId !== undefined) {
      return trailingEdge(Date.now());
    }
  };
  
  return debounced;
};

export const debounceLeading = (fn, wait) => 
  debounce(fn, wait, { leading: true, trailing: false });

export const debounceTrailing = (fn, wait) => 
  debounce(fn, wait, { leading: false, trailing: true });

export const debounceBoth = (fn, wait) => 
  debounce(fn, wait, { leading: true, trailing: true });

// Throttling
export const throttle = (fn, wait, options = {}) => {
  const { leading = true, trailing = true } = options;
  let timeoutId;
  let lastArgs;
  let lastThis;
  let lastCallTime = 0;
  
  const invokeFunc = (time) => {
    const args = lastArgs;
    const thisArg = lastThis;
    
    lastArgs = lastThis = timeoutId = null;
    lastCallTime = time;
    return fn.apply(thisArg, args);
  };
  
  const shouldInvoke = (time) => {
    const timeSinceLastCall = time - lastCallTime;
    return (lastCallTime === undefined || 
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0);
  };
  
  const trailingEdge = (time) => {
    timeoutId = null;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = null;
    return undefined;
  };
  
  const timerExpired = () => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    
    const timeSinceLastCall = wait - (time - lastCallTime);
    timeoutId = setTimeout(timerExpired, timeSinceLastCall);
  };
  
  const throttled = function(...args) {
    const time = Date.now();
    const shouldCallNow = shouldInvoke(time) && leading;
    
    if (shouldCallNow) {
      if (timeoutId === undefined) {
        timeoutId = setTimeout(timerExpired, wait);
      }
      return invokeFunc(time);
    }
    
    if (timeoutId === undefined && trailing) {
      lastArgs = args;
      lastThis = this;
      timeoutId = setTimeout(timerExpired, wait);
    }
    
    return undefined;
  };
  
  throttled.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    lastArgs = lastThis = lastCallTime = timeoutId = null;
  };
  
  throttled.flush = () => {
    if (timeoutId !== undefined) {
      return trailingEdge(Date.now());
    }
  };
  
  return throttled;
};

export const throttleLeading = (fn, wait) => 
  throttle(fn, wait, { leading: true, trailing: false });

export const throttleTrailing = (fn, wait) => 
  throttle(fn, wait, { leading: false, trailing: true });

export const throttleBoth = (fn, wait) => 
  throttle(fn, wait, { leading: true, trailing: true });

// Rate limiting
export const rateLimit = (fn, limit, interval) => {
  let queue = [];
  let activeCount = 0;
  
  return function(...args) {
    return new Promise((resolve, reject) => {
      queue.push({ args, resolve, reject });
      
      const processQueue = () => {
        if (queue.length === 0) return;
        
        if (activeCount < limit) {
          activeCount++;
          const { args, resolve, reject } = queue.shift();
          
          try {
            const result = fn(...args);
            if (result instanceof Promise) {
              result.then(resolve).catch(reject);
            } else {
              resolve(result);
            }
          } catch (error) {
            reject(error);
          }
          
          setTimeout(() => {
            activeCount--;
            processQueue();
          }, interval / limit);
        }
      };
      
      processQueue();
    });
  };
};

// Once and before/after
export const once = fn => {
  let called = false;
  let result;
  
  return function(...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
};

export const after = (count, fn) => {
  let remaining = count;
  
  return function(...args) {
    if (--remaining <= 0) {
      return fn.apply(this, args);
    }
  };
};

export const before = (count, fn) => {
  let remaining = count;
  
  return function(...args) {
    if (--remaining > 0) {
      return fn.apply(this, args);
    }
  };
};

// Spread and overArgs
export const spread = fn => (...args) => fn(args);

export const overArgs = (fn, transforms) => (...args) => {
  return fn(...args.map((arg, i) => transforms[i] ? transforms[i](arg) : arg));
};

// Factory functions
export const createMemoizer = (cacheType = 'map') => {
  if (cacheType === 'map') {
    return (fn, resolver) => memoize(fn, resolver);
  } else if (cacheType === 'weak') {
    return (fn, resolver) => {
      const cache = new WeakMap();
      return function memoized(...args) {
        const key = resolver(...args);
        if (cache.has(key)) {
          return cache.get(key);
        }
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
      };
    };
  }
  return memoize;
};

export const createThrottler = (options = {}) => {
  return (fn, wait) => throttle(fn, wait, options);
};

export const createDebouncer = (options = {}) => {
  return (fn, wait) => debounce(fn, wait, options);
};

// Version info
export const VERSION = '1.1.0';
export const version = '1.1.0';
export const description = 'Zero-dependency higher-order function utilities';

// Export all functions as named exports
export default {
  identity,
  constant,
  noop,
  unary,
  binary,
  ternary,
  negate,
  tap,
  over,
  isFunction,
  isAsyncFunction,
  isGeneratorFunction,
  curry,
  curryN,
  partial,
  partialRight,
  compose,
  pipe,
  memoize,
  memoizeSync,
  memoizeClear,
  debounce,
  debounceLeading,
  debounceTrailing,
  debounceBoth,
  throttle,
  throttleLeading,
  throttleTrailing,
  throttleBoth,
  rateLimit,
  once,
  after,
  before,
  spread,
  overArgs,
  createMemoizer,
  createThrottler,
  createDebouncer,
  version,
  description
};