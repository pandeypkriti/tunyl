# Kynection Digital Dockets — Research Brief

Sources current as of 2026-09-10. Kynection = Autolync Pty Ltd, trading as Kynection, founded 2006, HQ Seaford VIC; ~11-50 staff ([LinkedIn](https://au.linkedin.com/company/kynection)). The mobile app package name is `com.upvise.kynection` ([Google Play](https://play.google.com/store/apps/details?id=com.upvise.kynection)), confirming Kynection is a white-label build on the Upvise low-code platform, consistent with the homepage's claim to be Upvise's largest Australian partner ([kynection.com.au](https://www.kynection.com.au/)).

## 1. What a Kynection digital docket is

Kynection does not publish a field-by-field docket schema, so exact data-dictionary claims (tonnes vs m³ toggle, a dedicated "truck rego" field, a "load count" field) are **unverifiable at that level of granularity** — they are inferred from feature copy, not shown as a form spec.

What is confirmed: dockets are captured natively inside the Kynection/KIM app on **web, mobile, or tablet**, including named hardware (Zebra devices, Samsung Galaxy Tab Active) ([homepage](https://www.kynection.com.au/)), with **offline capture that syncs when connectivity returns** ("Mobile fieldwork access with offline capability"; crews "complete dockets offline... and sync when they return to the office or a site with coverage") ([digital-dockets-vs-paper-tickets](https://www.kynection.com.au/digital-dockets-vs-paper-tickets-why-construction-teams-are-making-the-switch/)).

Who creates it varies by industry vertical:
- **Trade/carpentry crews** (Parker Carpentry case study): a field worker logs into the app, selects a milestone/task/site, takes photos of completed work with a written explanation, and signs off at day's end; hours are calculated automatically rather than hand-written ([case study](https://www.kynection.com.au/case-studies/qa-with-parker-carpentry-contractors/)).
- **Quarry/haulage/earthmoving drivers**: the docket captures load cycles and material quantities, uses barcode scanning to validate the trailer and link it to a job, and detects tailgate open/close and tipper-body position in real time with GPS-stamped records ([earthmoving-and-quarry](https://www.kynection.com.au/industries/transport/earthmoving-and-quarry/)).
- **Weighbridge operations**: the system records gross and tare weights plus vehicle, product and customer details and auto-generates the digital docket from that weigh event ([weighbridge software guide](https://www.kynection.com.au/how-to-choose-the-best-weighbridge-software/)).

Photos and signatures are confirmed Kynection docket features (via the Parker Carpentry case study), not just a rival's feature. Geolocation/timestamp presence is confirmed generally ("GPS-stamped records") but a dedicated true **geofencing** feature (virtual-boundary alerts) is **not named anywhere on Kynection's own site** — only live GPS tracking and location-stamping are described. Treat "geofencing" as unconfirmed.

## 2. Post-creation flow, matching, invoicing, integrations

Kynection's own marketing describes **"automatic reconciliation between dockets, jobs, and invoices,"** which flags mismatches such as a docket that doesn't match the order quantity, a missing signature, or a blank required field ([digital-dockets-vs-paper-tickets](https://www.kynection.com.au/digital-dockets-vs-paper-tickets-why-construction-teams-are-making-the-switch/)). Manager approval before invoicing is referenced as a configurable option, but no formal dispute/rejection workflow (e.g., a supplier reject-and-resubmit loop) is documented on any page crawled — only outcome-level "fewer disputes" claims exist. This is a gap, not a confirmed feature.

Invoicing: "a completed docket flows into an invoice without manual re-entry" ([same source](https://www.kynection.com.au/digital-dockets-vs-paper-tickets-why-construction-teams-are-making-the-switch/)). The **Xero App Store listing** independently confirms bidirectional sync: invoices, credit notes, quotes and purchase orders flow KIM↔Xero, and timesheets sync KIM↔Xero into payroll ([apps.xero.com/us/app/kim](https://apps.xero.com/us/app/kim)) — this is the strongest third-party confirmation of the docket-to-invoice pipeline for at least one accounting package.

Accounting/ERP integrations named across Kynection's own pages (no single page lists all): **MYOB, Xero, Oracle** ([blog](https://www.kynection.com.au/digital-dockets-vs-paper-tickets-why-construction-teams-are-making-the-switch/)); **Reckon, Microsoft Dynamics, Viewpoint Vista, SAP Enterprise, EC1 M1, Sage Intacct** ([homepage](https://www.kynection.com.au/)); **Reckon, Sage, Acumatica** again on the quarry page ([earthmoving-and-quarry](https://www.kynection.com.au/industries/transport/earthmoving-and-quarry/)). Kynection is also listed in the Sage Intacct Marketplace ([marketplace.intacct.com](https://marketplace.intacct.com/MPListing?lid=a2DRn00000E8osfMAB)).

**Weighbridge integration**: a dedicated product, with weigh-event data feeding "directly into financial, compliance, and job management modules" ([weighbridge guide](https://www.kynection.com.au/how-to-choose-the-best-weighbridge-software/)).

**Proof of delivery**: confirmed and named — "upload proof of delivery images straight from site," mobile form capture for delivery receipts and vehicle inspections, with images attached to auto-generated invoices ([earthmoving-and-quarry](https://www.kynection.com.au/industries/transport/earthmoving-and-quarry/)).

## 3. Claimed benefits and numbers

Generic marketing claims (same wording template reused across at least two Kynection blog posts, one for construction and one for fuel distribution — treat as templated copy, not audited data): **"an extra ten to fifteen days of cash in the bank every month"** for businesses running 2–3 jobs a week; paper dockets take **3–5 business days** to invoice vs digital **same-day/within-hours**; full platform migration takes **4–8 weeks** ([digital-dockets-vs-paper-tickets](https://www.kynection.com.au/digital-dockets-vs-paper-tickets-why-construction-teams-are-making-the-switch/)). No methodology or third-party audit is cited for any of these figures — **REPORTED, not verified, medium-low confidence**.

Customer-specific numbers appear on Kynection's own [case-studies page](https://www.kynection.com.au/case-studies/), all self-reported by the customer with no independent audit:
- **Parker Carpentry Contractors**: docket-dispute rate fell from 15–20% to under 5% (~75% reduction), attributed by owner Simon Parker to auto-calculated hours plus photo evidence replacing handwritten dockets ([case study](https://www.kynection.com.au/case-studies/qa-with-parker-carpentry-contractors/)).
- **CSA**: 90% reduction in admin overhead. **DirectBor**: 50% reduction in admin work. **Cartage Australia**: 33% reduction in incidents/distractions/insurance premiums (via AI dashcams, not dockets). **Subitus Restore**: 94% reduction in quote time (eForms, not dockets). **Airtech NZ**: invoice time cut from 2–3 hours to 30 minutes ([case-studies index](https://www.kynection.com.au/case-studies/)).

Only Parker Carpentry's figure is directly about digital dockets specifically; the rest concern adjacent modules (dashcams, eForms, general admin).

## 4. Customers, market position, pricing, competitors

Kynection targets what its own Capterra listing calls **"dangerous and dirty" sectors**: construction, transport and logistics, mining, waste, restoration and specialised services ([Capterra](https://www.capterra.com.au/software/218798/kynection)). Case studies skew toward **SMB and sub-tier trade/civil contractors** rather than named Tier-1 head contractors: carpentry (Parker), civil pipe infrastructure (PMA), asphalt/civil (Roadsafe Asphalt), plumbing (Creative Plumbing), horticulture/field services, restoration, and manufacturing quality (Radeski) — plus a dedicated earthmoving/quarry/haulage vertical page with load validation and live truck tracking ([case-studies](https://www.kynection.com.au/case-studies/), [earthmoving-and-quarry](https://www.kynection.com.au/industries/transport/earthmoving-and-quarry/)).

Pricing is **not published on Kynection's own site** — its own Assignar comparison blog says only "custom pricing based on business size, number of users, and feature requirements" and notes "Kynection may be more expensive initially" ([assignar-vs-kynection](https://www.kynection.com.au/assignar-vs-kynection-side-by-side-2025-review-for-construction-operations-software/)). Third-party aggregator **Capterra lists a starting price of $60 AUD/user/month with no free tier** ([Capterra](https://www.capterra.com.au/software/218798/kynection)) — this figure is third-party sourced, not confirmed by Kynection directly, so treat as medium confidence.

**Named competitors**: Kynection itself names and compares against **Docketbook** ([docketbook.com.au](https://docketbook.com.au/)) in its docket-vs-paper blog posts, and publishes a dedicated comparison against **Assignar** ([assignar-vs-kynection](https://www.kynection.com.au/assignar-vs-kynection-side-by-side-2025-review-for-construction-operations-software/)). **Fleet Complete** surfaces in general market searches as an adjacent fleet-telematics player but is not directly compared by Kynection. **Envirosuite** is a false lead for this space — it is environmental/air-quality monitoring software, unrelated to digital dockets ([Envirosuite](https://au.linkedin.com/company/envirosuite)). **"Ecodocket" and "Gearbox" could not be verified as existing AU digital-docket products** — no evidence found in web search; do not cite them as real competitors without further confirmation.

## 5. Gaps — what Kynection dockets do NOT appear to cover

- **No evidence of capturing a third party's paper docket.** Every described flow assumes the docket is created natively by the user's own crew/driver inside the Kynection app. No feature was found for photographing or OCR-scanning a paper docket handed over by an external supplier, quarry, or haulier who is not on the Kynection platform — no photo-to-data-extraction or OCR capability is mentioned anywhere across the product, feature, or blog pages crawled. This is the most relevant gap for a subcontractor (like Rob) whose upstream suppliers/hauliers remain paper-based: Kynection digitises *your own* fleet's paper trail, not documents arriving *from* other companies' paper systems.
- No published field-by-field docket schema (units, rego field, load-count field) — inferred only from marketing copy.
- No confirmed true geofencing (boundary-trigger alerts) — only live GPS tracking/location-stamping is documented.
- No documented formal dispute/rejection workflow (accept/reject/resubmit) — only aggregate "fewer disputes" outcomes.
- No transparent, vendor-published pricing page.
- Weighbridge unit handling (tonnes vs cubic metres) not detailed.

## Sources
- [Digital Dockets vs Paper Tickets (construction)](https://www.kynection.com.au/digital-dockets-vs-paper-tickets-why-construction-teams-are-making-the-switch/)
- [Electronic Tickets vs Paper Dockets (fuel distribution)](https://www.kynection.com.au/electronic-tickets-vs-paper-dockets-elevating-fuel-distribution-and-efficiency/)
- [How to Choose the Best Weighbridge Software](https://www.kynection.com.au/how-to-choose-the-best-weighbridge-software/)
- [Earthmoving & Quarry industry page](https://www.kynection.com.au/industries/transport/earthmoving-and-quarry/)
- [Kynection homepage](https://www.kynection.com.au/)
- [Case Studies index](https://www.kynection.com.au/case-studies/)
- [Parker Carpentry Contractors case study](https://www.kynection.com.au/case-studies/qa-with-parker-carpentry-contractors/)
- [Assignar vs Kynection comparison](https://www.kynection.com.au/assignar-vs-kynection-side-by-side-2025-review-for-construction-operations-software/)
- [KIM on Xero App Store](https://apps.xero.com/us/app/kim)
- [Kynection KIM on Google Play](https://play.google.com/store/apps/details?id=com.upvise.kynection)
- [Kynection on Capterra AU](https://www.capterra.com.au/software/218798/kynection)
- [Kynection on Sage Intacct Marketplace](https://marketplace.intacct.com/MPListing?lid=a2DRn00000E8osfMAB)
- [Kynection LinkedIn](https://au.linkedin.com/company/kynection)
- [Docketbook](https://docketbook.com.au/)
- [Envirosuite LinkedIn](https://au.linkedin.com/company/envirosuite)

## Uncertain / needs verification
- Exact docket field schema (tonnes vs m³, dedicated rego/load-count fields) — not published, only inferred.
- True geofencing feature — not named; may be marketing shorthand for GPS tracking.
- Formal dispute/rejection workflow mechanics — no documented UI/process found.
- $60/user/month pricing — third-party (Capterra) only, not confirmed on Kynection's own site.
- "Ecodocket" and "Gearbox" as AU digital-docket competitors — unable to verify these exist; flagged, not confirmed.
- All case-study percentage improvements are customer self-reports with no independent audit trail disclosed.
