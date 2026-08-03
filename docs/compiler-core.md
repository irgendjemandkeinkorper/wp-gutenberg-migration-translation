# Core Gutenberg compiler (C3)

`src/lib/compiler/core.ts` serializes text-oriented semantic IR nodes into deterministic Gutenberg blocks. It supports paragraphs, headings, nested lists, quotes, code, and tables represented by the IR `extensions.rows` contract.

The compiler escapes text and allows only explicit link attributes. Unsupported nodes or missing table rows produce blocking findings and stable exception placeholders. Results retain the source node ID and structural source path for QA mapping.
