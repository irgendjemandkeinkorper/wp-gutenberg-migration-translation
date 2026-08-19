# Session Intent Contract

**Created:** 2026-08-18

## Job Statement
Re-evaluate the current status of the WP Gutenberg migration/translation project (post PR #154 merge) and produce a delegation-ready plan for other agents (Codex, Gemini/Jules, Copilot) covering: safe/mergeable open PRs, unblocked agent-ready backlog issues, blocked human-decision gates, and repo hygiene (stale branches).

## Answers Captured
- Goal: Review/improve existing
- Knowledge level: Well-informed
- Scope clarity: Clear requirements
- Success criteria: Clear understanding, Team alignment, Working solution, Production-ready
- Constraints: Must fit architecture, High stakes, Time pressure

## Success Criteria
1. Accurate map of current repo/PR/issue state (no stale assumptions).
2. A plan other agents can execute against without further Claude involvement for scoping.
3. Concrete queued actions (PR merges, issue assignments) identified.
4. Nothing ships without review — high-stakes compiler/profile work stays gated on human-decision items and CI.

## Boundaries
- Do not merge PRs or close issues without explicit user go-ahead (this is a planning session, not an execution session).
- Do not invent WordPress/GolfNow target capability data — issues #78/#91/#99-102 stay gated on human-provided target access; agents must not fabricate profiles.
- Respect existing GitHub label conventions (`agent-ready`, `Delegated-to-Jules`, `human-decision`, `exclusive-file-scope`) — don't relabel without authorization.
- Codex/Gemini/Jules do not make architecture or scope decisions — Claude (this session) owns synthesis and final call.

## Context Snapshot (as of 2026-08-18, HEAD 7ce374c)
- 7 open PRs, all green CI: 5 dependabot bumps (#157-161), 1 security fix (#156 XSS in data-URI sanitization), 1 perf fix (#155 Array.from removal).
- ~50 stale local/remote feature branches, most already merged into main via reconciliation PRs #135-154 — candidates for cleanup.
- Backlog milestone "M3: Template-Aware GolfNow Delivery" has a P0 compiler/profile chain largely blocked on two human-decision gates:
  - #78/#91: no authoritative GolfNow WordPress target data (theme.json, blocks, patterns) — blocks #94→#96→#97→#98→#100-102.
  - #68: "duplicate" backlog-audit issue blocking #70 (media reconciliation) → #13 (reconciliation report) → #98.
- #90 (template-profile validator + slot annotation format) is agent-ready and NOT blocked — can proceed now.
- #42 (remove 95MB unused vendor tree), #7 (CI import gate), #39/#40 (already Delegated-to-Jules) are unblocked, low-risk, agent-ready.
- #108, #107, #99-102 are release-readiness/QA epics, all human-decision-gated, downstream of the above.
