import fs from 'fs';
let code = fs.readFileSync('src/test/app.ui.test.tsx', 'utf8');

code = code.replace(
  /expect\(container\.textContent\)\.toContain\("Bundle cleared\."\);/,
  `expect(container.textContent).toContain("WXR bundle cleared.");`
);

code = code.replace(
  /const undoBtn = Array\.from\(container\.querySelectorAll\("button"\)\)\.find\(\n      \(btn\) => btn\.textContent === "Undo clear",\n    \) as HTMLButtonElement;/,
  `const undoBtn = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent === "Undo",
    ) as HTMLButtonElement;`
);

fs.writeFileSync('src/test/app.ui.test.tsx', code);
