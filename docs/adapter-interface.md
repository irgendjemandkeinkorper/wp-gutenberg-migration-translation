# Bounded source-adapter interface (G1)

`src/lib/adapters/interface.ts` defines deterministic CMS detection, evidence, bounded extraction hints, media expansion suggestions, structured page hints, diagnostics, and optional validated semantic IR. Adapter output cannot contain Gutenberg markup or bypass IR validation. Equal-confidence detections are resolved by adapter ID and surfaced as an explicit conflict; no match uses generic extraction.
