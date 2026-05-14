# Audit Apply Notes — AIDebtCollectionOptimizer

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_02.md` (lines 1001-1044).

The audit reports 30 routes / 1 AI endpoint and labels this a "CRITICAL gap."
Inspection shows ~9 AI endpoints exist beyond `/analyze`
(agent-scorecard, portfolio-analytics, communication-optimizer,
regulatory-alert-scan, coaching-leaderboard, payment-plan-recommend,
dispute-triage, results), so the gap is smaller than reported but still real.

## Original audit recommendations

### Missing AI counterparts (audit critical gap)
- `/score-debtor`, `/predict-contact-response`,
  `/recommend-contact-strategy` (partly via `communication-optimizer`),
  `/predict-payment-likelihood`, `/optimize-settlement-offer`,
  `/predict-dispute-outcome` (partly via `dispute-triage`),
  `/schedule-optimal-contact`, `/detect-fraud`, `/analyze-payment-pattern`.

### Missing non-AI features
- Phone system integration for automated outreach.
- SMS/email integration.
- Credit-bureau integration.
- FDCPA/TCPA compliance validation.

### Custom feature suggestions
- Predictive contact strategy.
- Dynamic settlement optimization.
- Fraud detection.
- Predictive compliance risk.
- Debtor segmentation.

## Implemented in this pass (mechanical)

1. `POST /api/ai/score-debtor` — closes audit gap `/score-debtor` (stateless).
2. `POST /api/ai/predict-payment-likelihood` — closes audit gap
   `/predict-payment-likelihood` (stateless).

Both added to `server/routes/aiNew.js`, follow the existing
`callOpenRouter` + `aiRateLimiter` pattern. No DB writes, no schema changes.
Verified with `node --check`.

## Backlog (not implemented this pass)

### Mechanical, low-risk
- `/api/ai/optimize-settlement-offer` — recommended settlement vs. profile.
- `/api/ai/detect-fraud` — fraud-pattern detection on a debtor record.
- `/api/ai/analyze-payment-pattern` — payment-pattern analysis.
- `/api/ai/schedule-optimal-contact` — best-contact-window prediction.

### Needs product decision
- Persistence model for predictions / scores.
- Segmentation taxonomy.

### Needs credentials / external SDK
- Phone (Twilio Voice / Plivo), SMS (Twilio).
- Credit bureaus (Equifax, Experian, TransUnion).
- Email (SendGrid, SES).

### Too risky / large refactor
- Real-time FDCPA/TCPA compliance validation engine.
- Auto-execution of contact strategies.

## Apply pass 3 (frontend)

`client/src/pages/AINewFeatures.jsx` already existed (calls `/api/ai/score-debtor`
and `/api/ai/predict-payment-likelihood` with `Authorization: Bearer <token>`
from `localStorage`) but was never imported or routed. Wired it in:

- `client/src/App.jsx` — imported `AINewFeatures` and added
  `<Route path="/ai-new" element={<AINewFeatures showToast={showToast} />} />`.
- `client/src/components/Header.jsx` — added nav entry
  `{ path: '/ai-new', label: 'AI Scoring' }`.

Backend already mounts `aiNewRoutes` at `/api/ai`. The 503-no-key path is
surfaced as an `error` field which the page renders inline. Babel-parse syntax
check on the three changed/added JSX files passed.

Action: **UPDATED-FE** (route + nav wiring; page itself untouched).

## Apply pass 4 (mechanical backlog)

Drained the four mechanical-backlog items from the previous pass — all
stateless, no DB writes, no schema changes, reuse `callOpenRouter` +
`aiRateLimiter`:

1. `POST /api/ai/optimize-settlement-offer`
2. `POST /api/ai/detect-fraud`
3. `POST /api/ai/analyze-payment-pattern`
4. `POST /api/ai/schedule-optimal-contact`

Frontend: extended `client/src/pages/AINewFeatures.jsx` with four matching
tool cards (icon + form fields + result rendering). The page already runs
under `/ai-new`, uses `Authorization: Bearer ${localStorage.getItem('token')}`,
and renders the backend `error` field inline — covering the no-key path
that `callOpenRouter` surfaces (it returns `{success:false, error, mock}`
when `OPENROUTER_API_KEY` is unset; the FE shows `error` in red).

Verification:
- `node --check server/routes/aiNew.js` → OK.
- `@babel/parser` (sourceType=module, plugins=['jsx']) on
  `client/src/pages/AINewFeatures.jsx` → OK.
- Smoke: started the server on `SERVER_PORT=39601`, logged in as
  `admin@debtoptimizer.com`, posted to `/api/ai/optimize-settlement-offer`
  → 200 (request reached `callOpenRouter`); `/api/ai/detect-fraud` → 200.
  Stopped the server.

No new dependencies, no `npm install` was run.

### Remaining backlog
- Same NEEDS-CREDS / NEEDS-PRODUCT-DECISION / TOO-RISKY items as before.
