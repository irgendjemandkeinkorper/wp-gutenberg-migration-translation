## 2024-06-25 - DOM Traversal Performance in JSDOM
**Learning:** Using `Array.from()` on `NodeList` or `NamedNodeMap` objects (like `element.childNodes` or `element.attributes`) creates significant memory allocation overhead in tight loops, especially when running on environments like JSDOM. When removing attributes, iterating over an array copy of `attributes` and calling `removeAttribute` is much slower than a simple `while (el.attributes.length > 0) el.removeAttribute(el.attributes[0].name)`. When iterating child nodes, using `.firstChild` and `.nextSibling` avoids array allocation.
**Action:** When working with DOM elements in a tight loop, prefer iterative `firstChild`/`nextSibling` traversal or in-place modification over converting `NodeList` to arrays using `Array.from()`.

## 2026-07-31 - [DOM Spread Syntax Limit and Slowness]
**Learning:** Using the spread operator to pass child nodes into DOM manipulation functions like `el.replaceWith(...Array.from(el.childNodes))` is very slow and can easily trigger `Maximum call stack size exceeded` errors if an element has many children (e.g. from pasted large HTML fragments).
**Action:** Avoid spread syntax for large lists of DOM nodes. Use `DocumentFragment` insertion or a standard `while(el.firstChild) { parent.insertBefore(el.firstChild, el); }` loop.

## 2024-08-02 - TreeWalker NodeFilter Crash in JSDOM
**Learning:** Replacing deep DOM cloning and `querySelectorAll` with a `TreeWalker` significantly speeds up text extraction (up to ~35x faster). However, accessing `NodeFilter` as a global variable (e.g., `NodeFilter.SHOW_ELEMENT`) throws a `ReferenceError` when tests run inside JSDOM or Node.js environments.
**Action:** Always use raw integer bitmasks (e.g., `5` for `SHOW_ELEMENT | SHOW_TEXT` and `1, 2, 3` for ACCEPT, REJECT, SKIP) instead of relying on global `NodeFilter` constants in cross-environment library code, or retrieve them safely via `document.defaultView`.
## 2024-08-07 - Inefficient Derived State from Large Maps
**Learning:** React state derived from iterating over a large Map using `Array.from()` or object spreads in `reduce()` executes on every render. If the Map updates frequently, the constant array reallocation and O(n²) object spread causes severe rendering slowdowns.
**Action:** When deriving object states from Map iteration during render loops (e.g. counting statuses), avoid `Array.from` intermediate objects, and mutate an initial state object using a standard `for...of` loop over `Map.prototype.values()`. For serializing a Map, iterate over `Map.prototype.entries()` rather than allocating an array with `Array.from()`.
