# Selective retry and invalidation (E4)

`src/lib/workspace/retry.ts` turns the E1 stage graph into an entity-scoped retry plan. A changed template profile invalidates profile-dependent planning/conversion/QA stages without reacquiring source pages; a changed page snapshot carries only that page identity through dependent scopes. Failed-item retries are recorded as an audit event and do not recompute unrelated committed work.
