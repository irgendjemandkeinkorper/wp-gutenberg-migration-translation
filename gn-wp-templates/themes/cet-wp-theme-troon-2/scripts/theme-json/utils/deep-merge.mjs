/**
 * Deep merge utility
 * Recursively merges objects, replacing arrays instead of concatenating
 */
export function deepMerge(target, source) {
  const output = { ...target };
  
  if (!isObject(target) || !isObject(source)) {
    return source;
  }
  
  Object.keys(source).forEach((key) => {
    const targetValue = target[key];
    const sourceValue = source[key];
    
    if (Array.isArray(sourceValue)) {
      // Arrays are replaced, not concatenated
      output[key] = sourceValue;
    } else if (isObject(sourceValue)) {
      if (key in target && isObject(targetValue)) {
        output[key] = deepMerge(targetValue, sourceValue);
      } else {
        output[key] = sourceValue;
      }
    } else {
      output[key] = sourceValue;
    }
  });
  
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}
