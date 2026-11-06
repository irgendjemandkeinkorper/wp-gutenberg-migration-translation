import re

with open("src/lib/validate.ts", "r") as f:
    content = f.read()

content = content.replace(
    '''  // ⚡ Bolt: Avoid Array.from allocation on static NodeList for performance
  const elements = body.querySelectorAll("*");
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];''',
    '''  // ⚡ Bolt: Avoid Array.from allocation on static NodeList for performance
  for (const el of body.querySelectorAll("*")) {'''
)
content = content.replace(
    '''  // ⚡ Bolt: Avoid Array.from allocation on static NodeList for performance
  const anchors = body.querySelectorAll("*");
  for (let i = 0; i < anchors.length; i++) {
    const el = anchors[i];''',
    '''  // ⚡ Bolt: Avoid Array.from allocation on static NodeList for performance
  for (const el of body.querySelectorAll("*")) {'''
)


with open("src/lib/validate.ts", "w") as f:
    f.write(content)
