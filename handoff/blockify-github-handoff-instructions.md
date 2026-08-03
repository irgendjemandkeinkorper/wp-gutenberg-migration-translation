# AI Handoff: Turn the Blockify PRD into a GitHub Execution Backlog

## Mission

Configure the GitHub backlog for `irgendjemandkeinkorper/wp-gutenberg-migration-translation` so multiple coding agents can implement the human-grade migration PRD safely and in parallel.

This task is **GitHub planning/setup only**. Do not implement product code, merge pull requests, publish content, delete existing issues, or close issues solely because they appear obsolete.

## Required inputs

Attach or place these two files in the AI's working context:

1. `blockify-human-grade-migration-prd.md` — product, architecture, quality, milestone, and issue requirements.
2. `blockify-github-issue-manifest.json` — authoritative machine-readable backlog setup plan.

The manifest is subordinate to the PRD if a genuine conflict exists. Record any conflict in the final setup report instead of silently inventing a resolution.

## Repository snapshot at handoff

Observed on August 3, 2026:

- Repository is public and has 61 commits.
- Application is a React/TypeScript/Vite client with conversion modules under `src/lib`.
- Existing pipeline includes extraction, tokenization, validation, block serialization, WXR, crawling, media handling, placeholders, templates, and QA metadata.
- Template selection currently records metadata but does not control output placement.
- Browser `localStorage` is currently a production-scale limitation.
- The repository had 27 open issues, 14 closed issues, 2 pull requests, and 10 open milestones when inspected.
- Existing outcome milestones:
  - `M1: Verified WordPress Import`
  - `M2: Resumable Migration Workspace`
  - `M3: Template-Aware GolfNow Delivery`
- Existing issues that must be reconciled rather than duplicated are recorded in the JSON manifest, notably #7, #10, #11, #13, #46-#48, #55-#56, #61, and #62.

Treat this snapshot as orientation, not current truth. Re-read GitHub before mutating it because the repository may have changed after the handoff.

---

## Copy/paste instruction for the executing AI

```text
You are the backlog-integration owner for the GitHub repository:
https://github.com/irgendjemandkeinkorper/wp-gutenberg-migration-translation

Your job is to turn the attached Blockify PRD and issue manifest into an idempotent, dependency-aware GitHub backlog that multiple coding agents can execute in parallel.

Inputs:
- blockify-human-grade-migration-prd.md
- blockify-github-issue-manifest.json

Scope and authority:
- You ARE authorized to create or update repository labels, milestones, and issues needed by the attached plan.
- You ARE authorized to add dependency links, cross-references, and idempotency markers to issue bodies.
- You must preserve useful existing issue content and discussion.
- You are NOT authorized to write implementation code, merge/close pull requests, assign coding agents, publish releases, delete issues, or close existing issues during this setup task.
- Do not create pilot-site child issues until actual pilot sites are approved; create only the H2 parent epic now.
- Do not create evidence-driven H4 child bugs until pilot evidence exists; create only the H4 parent epic now.

Use the installed GitHub connector if available. Otherwise use authenticated GitHub CLI/API. Do not use brittle browser clicking when a structured GitHub tool is available.

Read both input files completely before changing GitHub.

Execution protocol:

1. Inspect current repository state.
   - Read README, package.json, relevant source/test structure, open and closed issues, pull requests, milestones, labels, and issue relationships.
   - Confirm the existing issues listed in `existing_issue_reconciliation` still represent the stated outcomes.
   - Search by manifest marker, exact title, and semantic overlap. A title difference is not sufficient reason to create a new issue.

2. Build an in-memory reconciliation plan before mutation.
   For every manifest issue classify it as:
   - reuse/update existing issue;
   - create new issue;
   - blocked because a materially overlapping issue has an unresolved ownership/scope conflict.
   Do not stop for harmless wording differences. Stop only for a conflict that would cause duplicate or contradictory work.

3. Reconcile labels.
   - Create missing labels from the manifest with the specified description/color.
   - Reuse semantically equivalent existing labels instead of creating near-duplicates.
   - Do not rename or delete established labels unless explicitly required by the PRD.
   - Retain existing labels such as `agent-ready`, `enhancement`, `documentation`, `infrastructure`, and `tech-debt` where useful.

4. Reconcile milestones.
   - Update the descriptions of existing M1, M2, and M3 to include the manifest outcome and the complete PRD exit criteria.
   - Create M4 and M5 only if they do not already exist.
   - Keep the existing stabilization milestones. Do not create a competing duplicate roadmap.
   - Do not add speculative due dates.

5. Reconcile issues in dependency order.
   Recommended waves:
   - Existing Gate 0 work plus A1, B1, B2, B3, B4, B5.
   - A2, A3, A4, A5.
   - E1-E5 and C1-C6.
   - D1-D6.
   - F1-F5 and G1-G7.
   - H1-H5 parents.

   For an existing issue:
   - Preserve its useful original description.
   - Merge or append a clearly headed `PRD alignment` section containing the required contract, acceptance tests, dependencies, artifacts, and marker.
   - Do not erase comments, decisions, or narrower acceptance details that remain compatible.

   For a new issue, use this body structure:

   <!-- blockify-prd-issue-id:ID -->
   ## Outcome
   ## Context
   ## Scope
   ### Included
   ### Excluded
   ## Contract first
   ## Dependencies
   ## Primary ownership
   ## Acceptance criteria
   ## Tests and fixtures
   ## Produced artifacts
   ## Agent handoff

   Body requirements:
   - Expand the manifest's concise outcome using the cited PRD sections.
   - State explicit exclusions so parallel agents do not broaden scope.
   - Include `Blocks on` and `Enables` links using actual issue numbers once known.
   - Use native GitHub blocked-by/sub-issue relationships when the available tool supports them; always keep readable links in the body as a fallback.
   - Assign exactly one outcome milestone.
   - Apply the manifest priority and labels, plus compatible existing labels.
   - Leave assignee empty.
   - Add `agent-ready` only when all required contracts and authoritative inputs exist. If not, apply `needs-contract` or `human-decision` instead.
   - Keep file/package ownership narrow. An issue may not claim all of `src/` unless genuinely unavoidable.
   - Acceptance criteria must be objectively testable and include failure behavior.
   - Any work that can drop, reorder, duplicate, or mislink content must carry `fidelity-risk` and must require reconciliation coverage.

6. Handle parent/epic relationships.
   - Existing #13 is the parent/reconciliation outcome for A3 and A4, and represents A5 in the manifest. Add the child/dependency links without creating a duplicate A5 issue.
   - Existing #11 represents A1.
   - Existing #10 represents B3.
   - H2 is a parent epic only; future approved pilot sites get one child issue each.
   - H4 is a parent epic only; future evidence-backed failure classes get one child bug each with a minimal legal fixture.
   - If GitHub sub-issues are unavailable, use task-list links in the parent and `Parent epic` links in children.

7. Protect the template-profile boundary.
   - D1 may define the contract using clearly labeled synthetic fixtures.
   - D2 and D6 cannot claim completion without authoritative GolfNow theme/plugin exports or an inspected designated WordPress installation.
   - Do not invent private block names, schemas, pattern structures, attributes, or template slots.
   - If authoritative target access is unavailable, create/update the issues and apply `human-decision`; do not block the rest of backlog setup.

8. Verify the final GitHub state.
   - Every manifest ID appears exactly once as either an issue marker or an explicitly documented reuse mapping.
   - There are no duplicate titles/outcomes.
   - M1-M5 exist with the correct descriptions.
   - Every issue has exactly one outcome milestone.
   - Dependency links resolve to real issue numbers.
   - Existing issue content was preserved.
   - H2/H4 have no speculative child issues.
   - No issues were assigned, closed, or implemented.

9. Produce a final handoff report.
   Include:
   - links to every milestone created/updated;
   - a table mapping PRD IDs A1-H5 to GitHub issue numbers/URLs;
   - labels created/reused;
   - issues reused vs created;
   - dependency or relationship features that could not be represented natively;
   - blockers requiring human input;
   - recommended first four implementation agents with non-overlapping issue/file scope;
   - a statement that no implementation work was performed.

Idempotency requirement:
Re-running this setup must produce no duplicate milestones, labels, or issues. The marker `<!-- blockify-prd-issue-id:ID -->` is the primary stable identity, but you must also search titles and semantic overlap for issues created before markers existed.

Definition of done:
The GitHub backlog is fully navigable from milestone to issue to dependency; all PRD implementation outcomes are represented exactly once; existing work is preserved and incorporated; and the final report lets a human dispatch parallel coding agents without reconstructing context.
```

---

## Execution guidance and rationale

### Why reconciliation comes before creation

The repository already contains strategically aligned work. Blindly creating every manifest row would duplicate important tickets and divide discussion. The executing AI must treat the manifest ID as the target capability and GitHub issue number as its repository-specific realization.

### Why issue bodies must be contract-first

Multiple agents can safely work in parallel only when shared schemas land before consumers. The main contract issues are:

- B1 — acquisition/page snapshot.
- C1 — semantic IR.
- D1 — target capability and template profile.
- E1 — workspace/stage graph.
- G1 — source adapter interface.

Their dependents should remain `needs-contract` until the corresponding contract is merged or stable enough to implement against.

### Why M1 does not wait for the new IR

M1 proves the existing pipeline's WordPress import behavior and closes the most dangerous unknowns: local media, valid blocks, saved source evidence, placeholders, and post-import reconciliation. The typed IR is an M3 architectural requirement and can be developed after M1 contracts are understood. This keeps the urgent quality gate small enough to finish while avoiding a throwaway rewrite.

### Why WXR is not the sole delivery truth

WXR remains valuable as a portable bulk-import artifact, but it cannot by itself prove the final attachment IDs, URLs, block state, or filtered post content inside WordPress. The backlog therefore requires a disposable WordPress harness and post-import verification. A later authenticated REST/WP-CLI adapter can use actual destination responses for incremental delivery and reconciliation.

### Why template selection needs authoritative profiles

A marketing template name cannot tell the compiler which blocks, attributes, patterns, or locked slots exist. M3 therefore separates:

- target capability inspection;
- profile authoring/validation;
- semantic placement planning;
- Gutenberg compilation;
- imported conformance verification.

This lets a template/profile change be tested without rewriting the crawler or source adapters.

---

## Expected first implementation wave after backlog setup

The backlog-setup AI should recommend—but not dispatch—this first wave:

| Agent | Primary issue | Exclusive area | Must avoid |
|---|---|---|---|
| 1 | Existing #55 plus required Gate 0 CI | `.github/workflows`, CI scripts | Conversion behavior |
| 2 | A1 / existing #11 | Integration harness and WordPress fixtures | Production compiler modules |
| 3 | B1 then B2 | Acquisition schema and source archive/crawler | Media registry internals |
| 4 | B3 / existing #10 | Media registry and WXR media mapping | Crawler/source schema except consuming B1 |

The integration owner should merge B1 before B2/B3 finalize their storage records and should merge A1 before A2-A4 start their WordPress-side assertions.

---

## Human decisions that may remain after backlog creation

The AI should create the relevant issues and flag these rather than stalling the setup:

1. Access to authoritative GolfNow themes, required plugins, pattern exports, or a staging WordPress installation.
2. Approved WordPress authentication/delivery mechanism for staging.
3. First commercial page types and template profiles.
4. Raw-HTML retention, private-site acquisition, and deletion policies.
5. Whether translation is in scope or the repository should be renamed under existing issue #52.
6. Human migration-team baseline metrics.
7. Final profile, embed-policy, and release-approval authorities.

---

## Setup completion checklist

- [ ] PRD and manifest read completely.
- [ ] Current GitHub state inspected.
- [ ] Existing issues semantically reconciled.
- [ ] Missing labels created without near-duplicates.
- [ ] M1-M3 updated; M4-M5 created if missing.
- [ ] Manifest issues represented exactly once.
- [ ] Stable markers added.
- [ ] Each issue has one outcome milestone.
- [ ] Dependencies use real issue links.
- [ ] Existing content preserved.
- [ ] H2 and H4 remain parent-only.
- [ ] Authoritative target-data blockers are labeled, not guessed.
- [ ] No code, assignment, closure, deletion, or release action performed.
- [ ] Final mapping and handoff report delivered.

