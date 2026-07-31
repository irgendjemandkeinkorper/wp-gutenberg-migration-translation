/**
 * SCSS map parser
 * Parses the strict meta.inspect() output format for artifact maps
 * Only supports: maps, lists of maps, strings, simple scalar values
 */

export function parseScssMap(inspectOutput) {
  const tokens = tokenize(inspectOutput);
  const { value } = parseValue(tokens, 0);
  return normalizeKeys(value);
}

function tokenize(input) {
  const tokens = [];
  let i = 0;
  
  while (i < input.length) {
    const char = input[i];
    
    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
    // Map start
    if (char === '(') {
      tokens.push({ type: 'MAP_START', value: '(' });
      i++;
      continue;
    }
    
    // Map end
    if (char === ')') {
      tokens.push({ type: 'MAP_END', value: ')' });
      i++;
      continue;
    }
    
    // Colon separator
    if (char === ':') {
      tokens.push({ type: 'COLON', value: ':' });
      i++;
      continue;
    }
    
    // Comma separator
    if (char === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }
    
    // String (quoted)
    if (char === '"' || char === "'") {
      const quote = char;
      let value = '';
      i++;
      while (i < input.length && input[i] !== quote) {
        if (input[i] === '\\' && i + 1 < input.length) {
          value += input[i + 1];
          i += 2;
        } else {
          value += input[i];
          i++;
        }
      }
      tokens.push({ type: 'STRING', value: quote + value + quote });
      i++; // Skip closing quote
      continue;
    }
    
    // Identifier or value
    let value = '';
    while (i < input.length && !/[\s():,]/.test(input[i])) {
      value += input[i];
      i++;
    }
    if (value) {
      tokens.push({ type: 'IDENTIFIER', value });
    }
  }
  
  return tokens;
}

function parseValue(tokens, startIndex) {
  let index = startIndex;
  
  if (index >= tokens.length) {
    throw new Error('Unexpected end of tokens');
  }
  
  const token = tokens[index];
  
  // Map or list
  if (token.type === 'MAP_START') {
    index++;
    
    // Check if empty
    if (index < tokens.length && tokens[index].type === 'MAP_END') {
      return { value: {}, index: index + 1 };
    }
    
    // Try to parse as map first (key: value pairs)
    const mapResult = tryParseAsMap(tokens, index);
    if (mapResult) {
      return mapResult;
    }
    
    // Otherwise parse as list
    return parseList(tokens, index);
  }
  
  // String
  if (token.type === 'STRING') {
    return { value: token.value, index: index + 1 };
  }
  
  // Identifier
  if (token.type === 'IDENTIFIER') {
    return { value: token.value, index: index + 1 };
  }
  
  throw new Error(`Unexpected token: ${token.type}`);
}

function tryParseAsMap(tokens, startIndex) {
  let index = startIndex;
  const map = {};
  let isMap = false;
  
  try {
    while (index < tokens.length && tokens[index].type !== 'MAP_END') {
      // Parse key
      if (tokens[index].type !== 'IDENTIFIER') {
        return null;
      }
      const key = tokens[index].value;
      index++;
      
      // Expect colon
      if (index >= tokens.length || tokens[index].type !== 'COLON') {
        return null;
      }
      index++;
      isMap = true;
      
      // Parse value
      const { value, index: nextIndex } = parseValue(tokens, index);
      map[key] = value;
      index = nextIndex;
      
      // Skip comma if present
      if (index < tokens.length && tokens[index].type === 'COMMA') {
        index++;
      }
    }
    
    if (!isMap) {
      return null;
    }
    
    // Skip closing paren
    if (index < tokens.length && tokens[index].type === 'MAP_END') {
      index++;
    }
    
    return { value: map, index };
  } catch (e) {
    return null;
  }
}

function parseList(tokens, startIndex) {
  let index = startIndex;
  const list = [];
  
  while (index < tokens.length && tokens[index].type !== 'MAP_END') {
    const { value, index: nextIndex } = parseValue(tokens, index);
    list.push(value);
    index = nextIndex;
    
    // Skip comma if present
    if (index < tokens.length && tokens[index].type === 'COMMA') {
      index++;
    }
  }
  
  // Skip closing paren
  if (index < tokens.length && tokens[index].type === 'MAP_END') {
    index++;
  }
  
  return { value: list, index };
}

function normalizeKeys(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeKeys);
  }
  
  if (value && typeof value === 'object') {
    const normalized = {};
    for (const [key, val] of Object.entries(value)) {
      const camelKey = kebabToCamel(key);
      normalized[camelKey] = normalizeKeys(val);
    }
    return normalized;
  }
  
  // Remove quotes from string values
  if (typeof value === 'string') {
    const unquoted = value.replace(/^["']|["']$/g, '');
    return unquoted;
  }
  
  return value;
}

function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}
