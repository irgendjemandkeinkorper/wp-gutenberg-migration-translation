## 2024-05-24 - Optimize React List Rendering with React.memo
**Learning:** Frequent updates to a large state object (like the `batchStatus` Map) mapped over a list can cause significant O(N) re-renders for every status change, degrading performance.
**Action:** Extract the list item into a standalone `React.memo` component with a custom equality function. Pass only the specific scalar or stable derived data (like the specific item's status from the Map) as props to bypass unnecessary renders for unrelated list items.
