const fs = require('fs');

let code = fs.readFileSync('src/lib/validate.ts', 'utf-8');

code = code.replace(
  /const walker = doc\.createTreeWalker\(isolateChild2, 4\);/,
  `const walker = doc.createTreeWalker(isolateChild2, 4); // 4 is NodeFilter.SHOW_TEXT`
);

fs.writeFileSync('src/lib/validate.ts', code);
