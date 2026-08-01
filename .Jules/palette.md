## 2024-05-18 - Prevent Accidental Data Loss & Add Screen Reader Context
**Learning:** Destructive actions that clear all user data (like "Clear bundle") without confirmation can lead to significant frustration if clicked accidentally. Additionally, repeated generic action buttons (like "Remove") inside lists need contextual ARIA labels because screen readers will read them out of context (e.g., hearing "Remove" multiple times without knowing *what* is being removed).
**Action:** Always wrap bulk-destructive actions in a confirmation dialog (e.g., `window.confirm`). When rendering identical action buttons in a list, inject the item's title or identifying information into an `aria-label` to provide context for assistive technologies.

## 2025-03-03 - Visualizing Page Hierarchy Metadata in Batch Lists
**Learning:** When users process page hierarchies or page ordering in bulk, they need immediate visual feedback to confirm that relationships (like `parentId` or `menuOrder`) have been successfully parsed and preserved before downloading the generated bundle. Without this, users are left anxious and forced to download and inspect WXR files manually.
**Action:** Always render explicit inline metadata badges or labels (e.g. `[parentId: x, order: y]`) directly in list views for both loaded batch pages and active bundle pages to build confidence and streamline QA workflows.
