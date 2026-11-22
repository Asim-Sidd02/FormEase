# FormEase

**Know what to do. Do it with confidence.**

FormEase is a web-first guidance platform for India's government and documentation processes. You search in plain words, answer a few questions, and get a personalised roadmap: ordered steps, a document checklist, official links, progress tracking, reminders and a source-grounded assistant.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 and Zustand.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm start
npm run typecheck
```

## What's included

| Area | Where |
|---|---|
| Home, natural-language search, autocomplete, ⌘K / Ctrl K palette | `src/app/page.tsx`, `src/app/search`, `src/components/command-search.tsx` |
| Process detail: fees (government vs estimate), times, documents, steps, tips, official links, sources, last-verified date, report issue | `src/app/process/[slug]` |
| Branching wizard: one question at a time, "why are we asking?", answer review, edit answers later | `src/app/process/[slug]/start` |
| Journey dashboard: next-step hero, roadmap with dependencies and six step states, notes, checklist, activity history, export/print | `src/app/journey/[id]` |
| Application status and rejection help (paste a reason → likely causes, fixes, resubmission checklist) | `src/app/journey/[id]/status-help.tsx` |
| Assistant: retrieval-grounded, cites sources, redacts Aadhaar/PAN/OTP-like data, refuses forgery, says when it can't verify | `src/lib/assistant.ts`, `src/components/assistant.tsx` |
| My journeys, reminders (snooze, pause, edit), guest mode → sign-in migration, account and privacy controls (export/delete) | `src/app/journeys`, `src/app/reminders`, `src/app/account` |
| Content console: dashboard, process list, editor with draft → review → publish workflow, role permissions, real link checker, review queue, user reports, audit log | `src/app/admin`, `src/app/api/link-check` |
| About, how it works, how we verify, help, report, privacy, terms, disclaimer | `src/app/*` |

The UI also covers light and dark themes, mobile bottom navigation, keyboard navigation, focus rings, ARIA roles and reduced-motion support.

## Live data from official websites

Each guide shows a **Live from official sources** section. It is read from the official sites, not typed into the code:

```
official page / PDF ──► fetch (allow-listed gov domains, robots.txt respected)
                        └─ JavaScript-only portals → headless browser render
                    ──► extract text blocks, sections, links
                    ──► facts: fees (₹…), documents, time limits, forms — kept word-for-word
                    ──► compare with the version editors last reviewed → ok / changed
                    ──► snapshot store (.data/sources/*.json) ──► API ──► UI + assistant
```

- **Sources:** `src/content/sources.ts` lists 27 official pages and PDFs covering Passport Seva, UIDAI, UTIITSL, ECI, Parivahan, Udyam, NSP, EPFO, property registration and PM-KISAN. To track another page, add it there.
- **What users see:** fees, documents, time limits and forms, each quoted verbatim with the page it came from and when it was read. There is a "Check again" button, which is rate-limited.
- **Assistant:** answers are enriched with matching passages from the live official pages, marked "Official source (live)".
- **Change detection:**
  - If an official page changes after the last editorial review, users see a warning and the new official wording.
  - Editors see a diff in the content console under **Official sources** and click **Mark reviewed** once the guide is updated.
  - Guides are **never** rewritten automatically (spec §20).
  - Rotating content (carousels, tickers) is ignored, and a change must persist across two syncs before it is flagged.
- **Freshness:** a page older than `FORMEASE_SOURCE_TTL_HOURS` (default 12) is re-read in the background on the next visit. For scheduled syncing, use either option:
  - `npm run sync:sources` (`FORMEASE_URL=…`). It exits with code 2 when something changed, so a scheduler can alert editors.
  - A daily scheduler that calls `GET /api/cron/sync-sources` with `Authorization: Bearer $CRON_SECRET`.
- **JavaScript-only portals** (Passport Seva, myAadhaar, ECI) need a browser on the server. Set `FORMEASE_BROWSER_CHANNEL=chrome` (or `msedge`), or set `FORMEASE_BROWSER_PATH`. Without one, those sources show as "App-only portal" and everything else still works.
- **Not read automatically, on purpose:**
  - india.gov.in blocks automated clients, and we don't spoof a browser.
  - crsorgi.gov.in is a login portal.
  - State certificates (income, caste, domicile) live on 36 separate state portals. Add them per state as coverage grows.

See `.env.example` for every setting.

## Content model

Guides are typed data in `src/content/processes/*.ts` (see `Process` in `src/lib/types.ts`). Branching uses declarative conditions: `{ q, is }`, `{ q, not }`, `{ all }`, `{ any }`. The functions in `src/lib/engine.ts` turn answers into the steps and documents that apply. Fifteen guides ship across all nine categories: new passport, passport renewal/re-issue, Aadhaar address update, PAN, voter ID, driving licence, birth, income, caste and domicile certificates, Udyam registration, NSP scholarship application, EPF continuity after a job change, property document registration and PM-KISAN.

## ⚠️ Preview limitations — read before launch

- **Official-source snapshots** are JSON files in `FORMEASE_DATA_DIR`. Mount a persistent volume, or swap `src/lib/sources/store.ts` for a database table; nothing else depends on the storage. Serverless hosts with a read-only filesystem need the database option.
- **Protect the admin sync endpoints** by setting `FORMEASE_ADMIN_TOKEN` and `CRON_SECRET` in production.
- **The step-by-step guides are still hand-written and need editorial verification.** The live section quotes official pages directly, but the curated steps, questions and tips were drafted from general knowledge. Already corrected against the official sources: the Aadhaar update fees (₹50 at a centre, ₹25 online), PAN fees (₹107, or ₹72 for e-PAN only), the PAN form numbers (Form No. 93 / 95) and the Protean URL. A reviewer should still check:
  - the driving-licence waiting period
  - the late-registration rules for birth certificates
  - every remaining `lastVerified` date, which are placeholders
- **Data is stored in the browser (`localStorage`).** Accounts are a demo: the email code isn't sent, and any 6 digits work. For production, replace `src/lib/store.ts` with PostgreSQL/Prisma APIs and Auth.js, and keep the same action names.
- **Reminders are not delivered.** Reminders appear in the app; email delivery needs a background job and an email provider.
- **The assistant doesn't call an LLM.** It is deterministic retrieval over curated content and the live official snapshots. To add generation, replace `answer()` with a model call that is restricted to the same retrieved context and keeps the citation and refusal rules.
- **Team roles can be switched by hand.** Under Account → Team access you can switch roles so the content console can be explored. Remove this switcher before launch.
