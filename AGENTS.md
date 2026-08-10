# Interface Design Requirements

These requirements apply to every user-facing interface created or modified in
this repository: pages, components, states, prototypes, and responsive views.
Follow them by default unless the user explicitly requests an exception.

## Source of Truth

- Treat `DESIGN skill.md` as the complete design-system source of truth.
- Reuse its tokens and component patterns rather than inventing alternatives.
- When a requirement is ambiguous, choose the option most consistent with its
  photography-first, Apple-inspired visual language.

## Visual Direction

- Let the product, content, or imagery lead; interface chrome must stay quiet.
- Use generous whitespace and low visual density. Prefer one clear focal point
  per viewport or section.
- Compose marketing/editorial sections as edge-to-edge tiles, alternating
  light surfaces (`#ffffff`, `#f5f5f7`) and near-black surfaces (`#272729`,
  `#2a2a2c`, `#252527`, `#000000`) where appropriate.
- Do not add decorative gradients, ornamental frames, unnecessary borders, or
  shadows on navigation, text, cards, or general UI chrome.
- Use elevation only when a product image needs to rest on a surface; keep it
  to the single soft shadow defined by the design skill.

## Color and Typography

- Use `#0066cc` as the only standard interactive accent. Use `#0071e3` for
  focus and `#2997ff` for interactive elements on dark surfaces.
- Do not introduce additional accent or brand colors without explicit user
  approval.
- Use `#1d1d1f` for primary light-surface text and white for dark-surface
  text. Keep secondary text restrained (`#333333`, `#7a7a7a`, `#cccccc`).
- Use `SF Pro Display, system-ui, -apple-system, sans-serif` for headlines and
  `SF Pro Text, system-ui, -apple-system, sans-serif` for UI/body copy.
- Preserve the compact Apple display character: 56px/600/1.07 for hero
  headlines and 40px/600/1.1 for large displays, with subtle negative tracking.
- Prefer concise, confident copy. Avoid dense explanatory blocks in primary
  interface areas.

## Components and Layout

- Use the design-system spacing rhythm: 4, 8, 12, 17, 24, 32, 48, and 80px
  for sections. Do not introduce arbitrary spacing values when a token fits.
- Use the prescribed radii: 0, 5, 8, 11, 18px, and pills (`9999px`).
- Use blue pill buttons for primary actions (`11px 22px` padding). Use the
  compact dark utility button (`8px 15px`, 8px radius) only for utility actions.
- Prefer quiet text links or secondary white pill controls over additional
  prominent button styles.
- Keep navigation slim and unobtrusive; use the two-tier global/product
  navigation pattern when product navigation is needed.
- Ensure responsive layouts preserve hierarchy, ample breathing room, readable
  typography, and clear primary actions rather than merely shrinking desktop UI.

## Quality Check Before Completion

- Confirm the interface has one clear visual hierarchy and the product/content
  remains more prominent than the chrome.
- Confirm all interactive states remain within the single-blue accent system.
- Remove visual effects and decorations that do not communicate hierarchy or
  function.
- Verify contrast and keyboard focus remain accessible on both light and dark
  surfaces.
