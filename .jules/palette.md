## 2024-05-31 - Focus Visible and ARIA Expanded attributes
**Learning:** Adding standard `:focus-visible` outlines and hover transitions for interactive elements, along with `aria-expanded` attributes on toggle buttons, significantly improves keyboard navigation and provides essential context for screen reader users when UI sections expand or collapse.
**Action:** When working with toggleable sections or buttons without focus states in vanilla CSS projects, proactively add `aria-expanded` properties and define `:focus-visible` and `hover` styles on interactive elements to ensure the app is fully accessible.

## 2024-06-15 - Explicit Connection Modes and Disclaimers
**Learning:** Security choices must be visually and contextually explicit to operators. When an application supports multiple connection modes with varying levels of security (e.g., client-side key entry vs. server-side proxy), operators must be able to identify the current mode before performing any action. Highlighting these boundaries using prominent visual badges, distinct selection models, and helper disclaimers prevents human error and accidental credential storage.
**Action:** Always provide a highly visible indicator (such as a badge/bar) representing the active connection mode at the top level of the UI, and accompany credential inputs with specific disclaimer blocks clarifying security boundaries.
