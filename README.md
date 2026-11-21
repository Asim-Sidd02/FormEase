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

## Content model

Guides are typed data in `src/content/processes/*.ts` (see `Process` in `src/lib/types.ts`). Branching uses declarative conditions: `{ q, is }`, `{ q, not }`, `{ all }`, `{ any }`. The functions in `src/lib/engine.ts` turn answers into the steps and documents that apply. Ten guides ship: new passport, passport renewal/re-issue, Aadhaar address update, PAN, voter ID, driving licence, and birth, income, caste and domicile certificates.

## ⚠️ Preview limitations — read before launch

- **Content must be editorially verified.** The guides were drafted from general knowledge, and figures that weren't certain were hedged on purpose. The `lastVerified` dates are placeholders. Before publishing, a reviewer must check every fee, document list and URL against the official source. Specifically:
  - the Aadhaar update fee
  - PAN fees and the Protean/UTIITSL URLs
  - the driving-licence waiting period
  - the late-registration rules for birth certificates
- **Data is stored in the browser (`localStorage`).** Accounts are a demo: the email code isn't sent, and any 6 digits work. For production, replace `src/lib/store.ts` with PostgreSQL/Prisma APIs and Auth.js, and keep the same action names.
- **Reminders are not delivered.** Reminders appear in the app; email delivery needs a background job and an email provider.
- **The assistant doesn't call an LLM.** It is deterministic retrieval over curated content. To add generation, replace `answer()` with a model call that is restricted to the same retrieved context and keeps the citation and refusal rules.
- **Team roles can be switched by hand.** Under Account → Team access you can switch roles so the content console can be explored. Remove this switcher before launch.
