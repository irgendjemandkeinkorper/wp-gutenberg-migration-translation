## 2024-06-25 - DOM Traversal Performance in JSDOM
**Learning:** Using `Array.from()` on `NodeList` or `NamedNodeMap` objects (like `element.childNodes` or `element.attributes`) creates significant memory allocation overhead in tight loops, especially when running on environments like JSDOM. When removing attributes, iterating over an array copy of `attributes` and calling `removeAttribute` is much slower than a simple `while (el.attributes.length > 0) el.removeAttribute(el.attributes[0].name)`. When iterating child nodes, using `.firstChild` and `.nextSibling` avoids array allocation.
**Action:** When working with DOM elements in a tight loop, prefer iterative `firstChild`/`nextSibling` traversal or in-place modification over converting `NodeList` to arrays using `Array.from()`.

## 2026-07-31 - [DOM Spread Syntax Limit and Slowness]
**Learning:** Using the spread operator to pass child nodes into DOM manipulation functions like `el.replaceWith(...Array.from(el.childNodes))` is very slow and can easily trigger `Maximum call stack size exceeded` errors if an element has many children (e.g. from pasted large HTML fragments).
**Action:** Avoid spread syntax for large lists of DOM nodes. Use `DocumentFragment` insertion or a standard `while(el.firstChild) { parent.insertBefore(el.firstChild, el); }` loop.
