# DESIGN.md — Tunyl (docket to claim)

Direction locked 2026-08-03 from Refero research. References: Fingerprint (fingerprint.com —
warm off-white canvas, charcoal type, single vivid orange accent, dark terminal-like result
panels, technical-but-friendly) and Orderful (white/gray section discipline, one orange-red
accent used decisively). Rationale: field tool used on phones in sunlight → light canvas,
high contrast, one hi-vis-adjacent accent; quoted legislation must look like law, not chat.

## Constraint block (binding)

**Color**
- Canvas: `#FAF9F7` · Card surface: `#FFFFFF` · Border: `#E7E4DF`
- Ink: `#1A1C20` · Secondary ink: `#5A5F66`
- Dark panel (quoted law, hero chip): `#16181D`, ink on dark `#F2F1EE`, secondary `#9BA0A8`
- Accent (the ONLY accent): safety orange family. Brand/highlight `#E8590C`; button resting
  fill `#C94A08` (white text passes WCAG AA), button hover `#A83D06`; tint bg `#FDEEE3`;
  small text on tint uses `#A83D06`
- Severity (functional only, never decorative): critical `#C92A2A` on `#FBEAEA`,
  high `#B03D06` on `#FDEEE3`, medium `#8A5C00` on `#FBF3E0` (all AA at badge size)
- Success/confidence: `#2B7A3D` on `#E9F4EC`
- NOT doing: purple anything, gradients, more than one accent hue, dark mode (v1).

**Type**
- Display + UI: Archivo (variable, Google). Weights 500/600/700. Chosen for its industrial
  grotesque confidence; NOT Inter-by-default.
- Quoted legislation ONLY: Source Serif 4, italic off. Law is set in serif on the dark panel.
- Scale (px): 15 base / 18 / 22 / 28 / 36 / 44. Line-height 1.55 body, 1.15 display.
- NOT doing: mono display type, letterspaced uppercase labels, third typeface, `//` or `[01]`
  chrome, em dashes in copy.

**Space & shape**
- Spacing unit 8px. Section padding: 64px mobile / 96px desktop. Card padding 24px.
- Max content width: 760px (single-column flow; this is a tool, not a brochure).
- Radius, committed: 16px cards, 12px buttons/inputs/badges, 20px hero upload panel.
- Elevation: 1px border + `0 1px 2px rgb(0 0 0 / 0.04)`. No decorative shadows.

**Motion (one signature)**
- Arrival: 240ms ease-out fade + 6px rise, staggered 60ms on finding cards.
- Analysis progress: soft pulse on the status line. Transform/opacity only. Nothing else.

**Layout archetype**
- Landing = the tool: hero headline, then the upload card front and centre (photo + state
  select + analyze). Three-step "how it works" row. Footer carries the disclaimer.
- Verdict = report: scene summary card → severity-sorted finding cards (evidence → narrative
  → quoted clause on dark serif panel → controls → verify-on-site checklist) → draft
  register entry → disclaimer. Register page = saved verdicts list (localStorage v1).

**Copy rules**
- Sentence case everywhere. Plain, confident, site-supervisor language; no AI-speak, no
  hype adjectives, no em dashes. Legal posture: "indicator, verify on site", never "breach".
- Humanizer gate: skill unavailable in this environment; copy hand-audited against rules.

**Components**
- shadcn/ui primitives (button, select, card) restyled to tokens above; verdict rendering
  is bespoke. States (hover/focus/disabled/loading) required on every interactive element.

**Model defaults (webapp)**
- Provider auto-detected from the configured key: OpenAI default `gpt-5.6-terra`
  (verified 2026-08-04; Luna deferred pending eval), Anthropic default `claude-sonnet-5`.
  `HAZARD_PROVIDER`/`HAZARD_MODEL` override. Engine CLI keeps `claude-opus-5`.

## Back-office console variant (demos, added 2026-09-10)

Applies to `docs/demos/tunyl-back-office.html` and any future head-office or admin demo. Same
tokens, type and accent as above. Deliberate differences, recorded so they are not drift:

- **Width:** app shell up to 1120px with a 212px left tab rail (Refero product patterns: Zapier
  tables, Aboard HR, Programa). Explanatory sections below the shell return to the 760px column.
- **Tab rail collapses** to a horizontal scrolling row under 760px.
- **Dark panel role extended:** the dark serif panel carries verbatim interview quotes (evidence),
  not only quoted legislation. Presenter notes use the same dark panel at 14px.
- **Status chips** reuse the severity palette functionally: clear = success, check = medium,
  unreadable / hold = critical, derived = neutral. Never decorative.
- **Bars** are single accent on a neutral track with the figure written beside them; no legend.
- **Still not doing:** dark mode, gradients, a second accent, letterspaced uppercase labels.

## Tunyl app (added 2026-09-11)

The app is the demo made real. Same tokens. The office shell is the 1120px console with a
212px rail (see the variant above). Public pages (`/site/[token]` for the supervisor's phone,
`/c/[token]` for the builder's claim page) are the 760px single column. shadcn/ui primitives
carry the tokens through CSS variables in `globals.css`; the bespoke pieces (chips, tiles,
docket viewer, review queue, ledger tables) use the global classes ported from the demo.
Copy rules as above: sentence case, no em dashes, "read ok / check / unreadable", "nothing
enters silently".
