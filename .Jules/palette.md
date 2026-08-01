## 2024-05-18 - Prevent Accidental Data Loss & Add Screen Reader Context
**Learning:** Destructive actions that clear all user data (like "Clear bundle") without confirmation can lead to significant frustration if clicked accidentally. Additionally, repeated generic action buttons (like "Remove") inside lists need contextual ARIA labels because screen readers will read them out of context (e.g., hearing "Remove" multiple times without knowing *what* is being removed).
**Action:** Always wrap bulk-destructive actions in a confirmation dialog (e.g., `window.confirm`). When rendering identical action buttons in a list, inject the item's title or identifying information into an `aria-label` to provide context for assistive technologies.

## 2025-08-01 - Honest UI Select Labels & Metadata Context
**Learning:** Presenting options in a dropdown without clarifying their actual behavior can confuse users about what is metadata-only vs. functional transformation. Clear markings and labels prevent confusion during migration QA.
**Action:** Explicitly label metadata-only controls, append status qualifiers to option texts (e.g. "(Metadata-only)"), and supply clear hint descriptions explaining the impact of user selections.
