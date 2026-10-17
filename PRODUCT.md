# Product

<!-- impeccable:product-schema 1 -->

Product direction confirmed by the owner on 2026-10-15. Implementation details
below are grounded in the repository; open decisions are identified separately.

## Platform

web

## Users

Individuals tracking their daily personal finances are the primary audience.
Shared wallets are an optional extension for people who choose to track money
together; they should not complicate the individual workflow.

## Product Purpose

Wally helps people keep track of income and expenses in Peruvian soles through
quick manual entries and clear monthly summaries. Success means being able to
record everyday activity, understand the resulting balance and spending, and
find or correct a past entry without unnecessary effort.

## Positioning

The confirmed focus is a personal finance record with optional shared wallets:
users enter their own transactions and review the resulting history and monthly
summaries. Banking integrations and debt management are outside the current
scope. A unique competitive claim has not been established.

## Operating Context

- The interface is in Spanish, with PEN currency formatting for Peru.
- `/` presents the public landing to signed-out visitors. Acceder and the landing
  calls to action open the access screen; Continuar con Google starts sign-in.
  A verified session goes directly to the wallet or its required welcome flow.
- Users sign in with Google and access their wallets through their account.
- The main workflow is Registro: choose income or expense, enter the amount,
  category, payment method, and date, optionally add a note, then save.
- Movimientos supports reviewing, searching, filtering, editing, deleting, and
  exporting transactions. Resumen presents monthly totals and charts.
- Users can create shared wallets or join through an invitation code. The owner
  manages membership; members can view, add, edit, and delete wallet transactions.
- Cloud storage makes account data available across devices. Saving requires
  internet; wallet data refreshes periodically and when returning to the app.

## Capabilities and Constraints

- Personal wallets are private. Accounts created after the onboarding migration
  must register one positive initial PEN balance after Google sign-in. Existing
  accounts bypass this welcome. Shared wallets remain separate and start empty.
- Onboarding is a dedicated single-step screen, with no skip or zero option.
  Its completion is stored in Supabase across sessions and devices. The initial
  balance is a real income in the reserved Saldo inicial category, with no payment
  method; it contributes to balance and the month's income. Users can correct its
  amount, note and date, or delete/undo it, without reopening the welcome.
- Transactions and custom categories belong to a wallet. Each wallet has one
  currency, and the current implementation supports PEN only.
- Amounts are stored as integer cents. Balances are calculated from transactions.
- Transaction descriptions are optional notes, limited to 160 characters. Without
  a note, the interface uses the category as a display title; exported notes stay empty.
- Cash, transfer, debit, and credit describe recorded payment methods. Recording a
  credit payment does not manage a bank account, debt, installments, or card cycle.
- CSV export is available for transaction records, including filtered history.
- Production requires Google authentication and Supabase cloud storage; `/demo`
  redirects to `/`. The landing's interactive example uses fictitious amounts
  and does not save transactions. Local development on loopback hosts offers an
  explicit Usuario de prueba button on the access screen, with its own
  browser-only wallet. It starts with
  onboarding, persists test movements and supports restarting the test. It neither
  authenticates with Supabase nor imports real-account data, and is unavailable in
  production. Shared wallets and real authentication still require Google.
- Shared-wallet invitation codes are single-use and expire after seven days.
  Wally does not send invitation emails automatically.
- Access rules isolate accounts and wallets. Version checks detect conflicting
  edits by other members. Preserve these protections in future interface work.
- Browser preferences are scoped by user and wallet. Legacy local wallet data
  is not displayed or imported into an account.

## Brand Commitments

The product name is Wally. Spanish is the confirmed user-facing language.
The owner approved Wally Mercado on 2026-10-15: a close, fresh identity using
coral and green, a flat two-stroke W, and a lowercase wordmark. The identity
is shared across sign-in, welcome, the app header, and favicon. This brand
commitment does not change the personal-finance scope or account behavior.
DESIGN.md records the implemented visual tokens and reusable controls.

## Evidence on Hand

- `README.md`: current scope, routes, account behavior, and data model.
- `app/page.tsx` and `components/wally/landing-page.tsx`: public entry, clearly
  identified interactive example, and access actions.
- `components/wally/auth-boundary.tsx`: sign-in and account access messaging.
- `components/wally/cloud-workspace.tsx`: wallet selection, sharing, and membership.
- `components/wally/transaction-form.tsx`, `transaction-history.tsx`, and
  `insights.tsx`: entry, history, and monthly-summary workflows.
- `components/wally/info-panels.tsx`: existing help and privacy explanations.
- `lib/finance.ts`, `lib/insights.ts`, and `lib/export.ts`: financial calculations,
  filtering, and export behavior.
- `supabase/migrations/` and `tests/`: access rules and existing automated checks;
  these are implementation evidence, not a compliance certification.
- `app/icon.svg` and existing UI copy provide current product assets. There are
  no supplied testimonials, adoption figures, savings claims, or comparative
  benchmarks to use as product proof.

## Product Principles

1. Keep everyday manual entry quick and understandable for an individual user.
2. Make summaries traceable to the underlying transactions and chosen period.
3. Keep personal records private and make the scope of sharing explicit.
4. Give users control through editable history and exportable records.
5. Describe saving, synchronization, and product limitations accurately.

## Open Decisions

Quantitative success targets, a validated competitive distinction, and any
product-specific accessibility requirements remain unconfirmed. Do not invent
them or claim accessibility conformance from the presence of individual features.
