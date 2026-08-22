import fs from 'fs';
let code = fs.readFileSync('src/lib/validate.ts', 'utf8');

code = code.replace(
  /const walker = doc\.createTreeWalker\(child2, 4\); \/\/ SHOW_TEXT/,
  `const walker = doc.createTreeWalker(child2, NodeFilter.SHOW_TEXT);`
);

fs.writeFileSync('src/lib/validate.ts', code);
