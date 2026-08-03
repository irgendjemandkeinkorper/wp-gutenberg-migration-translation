# Reliability corpus

`src/test/reliability-fixtures.test.ts` runs the fixtures in this directory through the deterministic `convertPage` pipeline with the LLM disabled. Each case asserts required text, removed page chrome, ordered asset dispositions, visible exception placeholders, and generated block markers.

| Fixture | Failure class covered | Expected safety behavior |
| --- | --- | --- |
| `hosted-builder.html` | hosted-builder wrappers and proprietary interaction | preserve page content and image; retain the booking iframe as an explicit placeholder; drop scripts and builder chrome |
| `static-table.html` | legacy static layout and table markup | preserve headings, table rows, and the scorecard image |
| `invalid-nesting.html` | malformed/invalid nesting | retain all user-visible text and list items after browser parsing and whitelist validation |
| `encoding.html` | declared legacy encoding and entity/unicode content | preserve accented characters and encoded punctuation |
| `repeated-chrome.html` | repeated header, navigation, sidebar, and footer | keep the article content while excluding repeated chrome |

Run the focused corpus with:

```sh
npx vitest run src/test/reliability-fixtures.test.ts
```

These fixtures intentionally use no proprietary scripts or live network calls. A proprietary interaction is represented by the unsupported-asset exception contract, not copied executable code.
