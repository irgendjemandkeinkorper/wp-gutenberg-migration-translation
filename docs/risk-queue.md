# Migration risk scoring and QA queue (F4)

`src/lib/qa/risk.ts` converts deterministic finding severity, resolution state, confidence, and source-evidence completeness into a bounded risk score. Queue filtering and ranking are deterministic, so QA operators can select blocking/open/low-confidence work without recomputing unaffected migration artifacts.
