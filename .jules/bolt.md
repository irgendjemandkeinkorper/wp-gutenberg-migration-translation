## 2025-02-18 - [Large Map Updates]
**Learning:** React functional components mapping over frequently updated Map values (like `batchStatus.get()`) without item-level memoization will cause O(N) full re-renders for every single update, crippling performance on large lists.
**Action:** Extract list items to `React.memo` components passing the specific Map value and a stable `key` to prune the render tree.
