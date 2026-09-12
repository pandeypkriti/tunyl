# DESIGN.md — Tunyl (docket to claim)

Direction v2, locked 2026-09-12 from six references Kriti supplied: Archdesk's estimating
sheet, dashboard and daily site report (approval stepper, KPI cards with a coloured underline,
dense sortable tables, money coloured by meaning, a rail of sections), Airtable's data view with
its AI panel (status chips, filter/sort toolbar, "what do you want to know" + suggested
questions), and Sahova's home and activity feed (a greeting, one big ask input, hairline lists,
icon-tile feed rows with monospace project tags). Refero styles consulted: Attio, Cal.com,
Perplexity, shadcn (monochrome, hairline, type-led operations tools).

Thesis: a clean operations console. Cool greys on white, indigo as the one working colour,
green / amber / red carry state and money, and every docket and claim shows where it sits in
its lifecycle as a stepper. Calm on the home page, dense where the numbers live.

## Constraint block (binding)

**Color**
- Canvas `#F6F7F9` · Surface `#FFFFFF` · Surface 2 (hover, alt rows) `#F1F3F6`
- Border `#E4E7EC` · Border strong (inputs) `#D0D5DD`
- Ink `#101828` · Ink 2 `#475467` · Ink 3 (muted, meta) `#667085`
- Primary (the ONLY working colour: buttons, active nav, links, focus): indigo `#4F46E5`,
  hover `#4338CA`, soft `#EEF2FF`, ink-on-soft `#3730A3`
- State, functional only, never decorative:
  success `#15803D` on `#DCFCE7` (ink `#166534`) · warning `#B45309` on `#FEF3C7` (ink `#92400E`)
  · danger `#B91C1C` on `#FEE2E2` (ink `#991B1B`) · info `#1D4ED8` on `#DBEAFE` (ink `#1E40AF`)
- Money: amounts owed to us / verified / positive in success ink; costs, held, overdue in danger ink;
  plain figures in ink. Never colour a number that carries no meaning.
- NOT doing: orange, warm cream, gradients, dark mode (v1), more than one working colour.

**Type**
- UI and display: Geist (Google), weights 400/500/600. Tabular figures everywhere numbers stack
  (`font-variant-numeric: tabular-nums`).
- Mono: Geist Mono for docket numbers, times, project tags, keyboard hints. Small caps tags are
  Geist Mono 11px uppercase with 0.06em tracking; this is the one permitted uppercase treatment.
- Scale (px): 12 meta · 13 table · 14 body · 16 emphasis · 20 section · 24 page title ·
  30 KPI figure · 32 home greeting. Line-height 1.5 body, 1.2 headings, 1.1 figures.
- NOT doing: serif anywhere, bold (700) display, letterspaced uppercase outside mono tags.

**Space and shape**
- Unit 4px. Page padding 24px (16px under 640px). Section gap 24px. Card padding 20px.
- Radius: 6px inputs and buttons, 8px table frames and menus, 12px cards, 999px chips and stepper pills.
- Elevation: 1px border, shadow `0 1px 2px rgb(16 24 40 / .06)` on cards; panels and menus
  `0 8px 24px rgb(16 24 40 / .12)`.
- Hairline lists (1px `#E4E7EC` between rows) are the default for short lists; cards only for KPIs,
  records and documents.

**Layout archetype**
- Office shell: left sidebar 240px (white, border-right) with grouped nav and 16px icons, queue
  count as a pill; top bar 56px with the workspace name, Ask Tunyl (⌘K) and the signed-in name.
  Content is full width up to 1280px with 24px gutters. Under 900px the sidebar becomes a
  horizontal scroll row under the top bar.
- Home: greeting ("Good morning, Mel"), the ask input as the hero, then KPI row, then two columns:
  what needs a person (hairline list) and today's activity feed; then claims waiting on money.
- Record (a docket, invoice or instruction): page title, "Sent by · on", project link, the
  lifecycle stepper, then sections with boxed values, the photo, flags, and one green Approve
  split-button with Send back in the menu. Same skeleton for a claim.
- Tables: sticky header, sortable columns, a toolbar with search and status filters, right-aligned
  numbers, a status chip column, row click opens the record.
- Public pages (site, builder): single column 760px, no sidebar, same tokens.

**Components**
- shadcn/ui primitives restyled through CSS variables (button, input, select, checkbox, table,
  tabs, sheet, dropdown-menu, dialog, tooltip, separator, command). Data tables on TanStack Table.
- Shared bespoke: AppShell, Sidebar, Topbar, AskPanel, Stepper, KpiCard, StatusChip, DataTable,
  ActivityFeed, PageHeader, FieldGroup, Money.
- Every interactive element: hover, focus-visible (2px primary ring), disabled, pending.

**Motion (one signature)**
- Panels slide 200ms ease-out; list rows fade-rise 160ms on arrival; nothing else moves.

**Copy rules (unchanged product rules)**
- Sentence case. Plain language. "read ok / check / unreadable". "matched by rule" / "ticked by".
  "Nothing enters silently." Money actions are drafts until confirmed. No em dashes, no hype.
