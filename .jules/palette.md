## 2024-05-31 - Focus Visible and ARIA Expanded attributes
**Learning:** Adding standard `:focus-visible` outlines and hover transitions for interactive elements, along with `aria-expanded` attributes on toggle buttons, significantly improves keyboard navigation and provides essential context for screen reader users when UI sections expand or collapse.
**Action:** When working with toggleable sections or buttons without focus states in vanilla CSS projects, proactively add `aria-expanded` properties and define `:focus-visible` and `hover` styles on interactive elements to ensure the app is fully accessible.

## 2025-02-15 - Resilient Clipboard Operations & Focusable Elements
**Learning:** Browser clipboard write actions can fail or be rejected under strict sandbox permissions, insecure contexts, or virtual environments. To ensure seamless user experience, we must handle these errors by fallback manual selection, focusing the content view, and offering prominent guidance text. Additionally, rendering scrollable block code containers with `tabIndex={0}` ensures they are keyboard focusable and scrollable for assistive technologies.
**Action:** Wrap browser clipboard writes in try-catch structures. When failures happen, automatically select and focus the corresponding text, display clear instructions in an accessible container, and ensure scrollable elements have proper keyboard access indicators.
## 2024-06-15 - Explicit Connection Modes and Disclaimers
**Learning:** Security choices must be visually and contextually explicit to operators. When an application supports multiple connection modes with varying levels of security (e.g., client-side key entry vs. server-side proxy), operators must be able to identify the current mode before performing any action. Highlighting these boundaries using prominent visual badges, distinct selection models, and helper disclaimers prevents human error and accidental credential storage.
**Action:** Always provide a highly visible indicator (such as a badge/bar) representing the active connection mode at the top level of the UI, and accompany credential inputs with specific disclaimer blocks clarifying security boundaries.
## 2024-11-20 - Non-blocking Undo for Destructive Actions
**Learning:** Destructive actions, even when protected by a confirmation dialog, can still be clicked accidentally. Adding a transient "Undo" option after the destructive action improves confidence and allows users to recover safely.
**Action:** Implement "Undo" workflows for destructive actions, using transient local state. Ensure to announce the change and the presence of the undo option to screen readers using `aria-live="polite"` or `role="alert"`.

## 2024-08-10 - Transience and Non-blocking destructive actions
**Learning:** For bulk data deletion (like clearing a list of imported pages), abrasive `window.confirm` dialogues interrupt workflow. Replacing these prompts with an immediate clear action that offers a highly visible, contextual "Undo" button (utilizing `aria-live` for screen readers) provides a much better and safer user experience.
**Action:** Always favor transient state recovery ("Undo") over blocking modal confirmations for destructive actions in the UI, especially where data is primarily held in memory. Ensure the undo trigger is prominently placed where the deleted items used to be.
