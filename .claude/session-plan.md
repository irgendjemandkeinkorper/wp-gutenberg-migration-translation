# Session Plan

**Created:** 2026-08-18
**Intent Contract:** See .claude/session-intent.md

## What You'll End Up With
A cleared PR queue, one unblocked P0 backlog issue (#90) actively worked by Codex, repo hygiene done (stale branches + vendor tree), and a explicit unblock list for the two human-decision gates (#78/#91 target data, #68 audit) that are currently stalling the rest of the M3 compiler chain.

## How We'll Get There

### Phase Weights
- Discover: 10% - Already well-informed; just confirmed live PR/issue/branch state via `gh`.
- Define: 20% - Lock which issues are truly unblocked vs. gated, confirm delegation labels/boundaries.
- Develop: 45% - Merge safe PRs, assign #90/#42/#7 to Codex, keep #39/#40 with Jules.
- Deliver: 25% - CI verification on every merge, code review before closing anything P0/release-blocker.

### Human-Decision Gates (you, not an agent, must clear these)
1. **#78 / #91** — need authoritative GolfNow WordPress target data (theme.json, block/pattern inventory) before #94/#96/#97/#98 and the M3 epic can move. No agent should fabricate this.
2. **#68** — "duplicate" backlog audit issue currently blocking #70 → #13 → #98. Likely a quick close/resolve on your end; unblocks two release-blocker issues.

### Immediate Actions (no gate needed)

**Merge queue (all green CI, low risk):**
- #157-161: dependabot bumps (genai, vite, jsdom, @types/react, typescript-eslint) — merge as-is.
- #156: XSS fix in data-URI sanitization — security fix, merge after a quick review given "high stakes."
- #155: Array.from allocation removal in extractContent — perf fix, low risk.

**Delegate now:**
- Codex → **#42**: checked before dispatching — `gn-wp-templates/` is already gone from the working tree (removed in `fcb6e00`, already an ancestor of `main`). Nothing to build; issue just needs closing. Not dispatched.
- Jules → **#39/#40** (already labeled `Delegated-to-Jules`: responsive/a11y pass, design-token separation). No change needed, just confirm still queued.

**Result: zero live coding work was actually dispatchable this session.** Every candidate that looked agent-ready on labels alone turned out blocked or already done on inspection. The real next action is clearing #68 and providing GolfNow target data for #78/#91 — until then there is no compiler/profile work for Codex to safely start.

**CORRECTED — do not dispatch (found on closer read of issue bodies):**
- ~~#90~~ — its own "Dependencies" section says `Blocks on: #78`. Same human-decision gate as the rest of the M3 chain despite the `agent-ready` label and empty GitHub sub-issue `blocked-by` field. GitHub's `blocked-by` field ≠ the PRD body's "Blocks on" line — check both before trusting a label.
- ~~#7~~ — dependencies trace through #13 → #70 → #68 (the backlog-audit gate), and its acceptance criteria require the whole M1 milestone exit criteria, not just CI plumbing.

**Repo hygiene (Gemini or Codex, bounded, non-destructive):**
- Audit ~50 local/remote branches against merged PRs #135-154; produce a delete-candidate list (do NOT delete without your confirmation — many are already merged duplicates from the reconciliation sweep).

### Do-Not-Touch (stays gated)
- #94, #96, #97, #98, #99, #100, #101, #102, #107, #108 — all downstream of the #78/#91 human-decision gate or QA/pilot epics. No agent should start these until target data or pilot cohorts exist.

## Provider Requirements
🔴 Codex CLI: Available ✓
🟡 Gemini CLI: Available ✓
🧭 Antigravity CLI: Not installed ✗
🟢 Copilot CLI: Available ✓
🟠 Qwen CLI: Not installed ✗
⚫ Ollama: Not installed ✗
🔵 Claude: Available ✓
🟣 Perplexity: Not configured ✗

## Success Criteria
1. Clear understanding — captured above, backed by live `gh pr/issue` state, not guesses.
2. Team alignment — Codex/Jules assignments map to existing labels, bounded scope stated per issue.
3. Working solution — PR queue clearable today; #90/#42/#7 have concrete next actions.
4. Production-ready — nothing merges without green CI; nothing on the P0 compiler chain proceeds without the human-decision gates.

## Next Steps
1. Review this plan.
2. Decide on #68 (audit issue) — closing it unblocks #70/#13.
3. When ready to act, merge the PR queue and dispatch #90/#42/#7 to Codex (e.g. via `/octo:develop` or direct issue assignment).
4. Provide GolfNow target data when available to unblock #78/#91 and the rest of M3.
