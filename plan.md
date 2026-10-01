1. Extract list items in `SourceInputPanel` to a `React.memo` component:
  - This prevents O(N) re-renders when a single map value in `batchStatus` updates. By passing the individual `BatchState` value, React will only re-render the list items whose state actually changed.
2. Complete pre-commit steps:
  - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
