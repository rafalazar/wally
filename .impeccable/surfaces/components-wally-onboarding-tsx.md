---
version: 1
slug: "components-wally-onboarding-tsx"
primary_target: "components/wally/onboarding.tsx"
related_targets: ["components/wally/cloud-workspace.tsx","app/workspace.css"]
---

# Bienvenida con saldo inicial

Mode: Operate. A new Google account records one real, positive PEN income before entering its personal wallet. Existing accounts bypass this step. Code-first; no new visual identity or generated imagery.

## Direction contract

THESIS: One amount is the whole task. The welcome makes the first real balance tangible, without a tutorial carousel or extra setup fields.

OWN-WORLD: Extend Wally's cream background, Plus Jakarta Sans, white surfaces and income green. Existing branding stays recognizable; restrained coral belongs only to the brand.

STORY: Understand what money to enter, enter it, save once, and see that same amount in the wallet. A completed server write earns the success announcement.

FIRST VIEWPORT: Wally and sign-out across a quiet header. On desktop, a large friendly question on the left and an amount-led white form on the right. On mobile, heading, explanation, amount and full-width action stack naturally. No dashboard behind the welcome.

FORM: User-selected dedicated single-step screen, directly shaped within the incumbent app. Seed: not applicable to this precisely specified extension. Signature interaction: the entered amount becomes the confirmed wallet balance, with one brief reduced-motion-aware arrival transition.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Boundaries: no skip, zero amount, payment-method question or shared-wallet setup. Errors preserve the draft. Read existing visual system without rewriting it. No new raster assets are required.

## Implemented surface

Recorded from `components/wally/onboarding.tsx` and `app/workspace.css` on 2026-10-15. The incumbent system is documented in root `DESIGN.md`; this section keeps the welcome-specific decisions local.

- Desktop: a cream page with a 1120px header and a 1000px two-column body, 64px column gap and a white bordered form without a shadow. The question uses `clamp(38px, 4.5vw, 62px)`, weight 800, line-height 1.08 and a green final word. The explanatory copy is limited to 36ch.
- At 760px and below: one column, at most 460px wide, 20px page gutters and 28px between introduction and form. The form uses 26px by 24px padding and a 22px radius. The heading uses `clamp(34px, 8.5vw, 44px)`.
- The PEN prefix stays separate from the tabular amount. More than seven characters activates the long-amount variant: `clamp(24px, 2.8vw, 36px)` on desktop and `clamp(22px, 7vw, 28px)` on mobile. This preserves the complete maximum amount, prefix and focus ring at 320px and 390px.
- The green action fills the form width, has a 54px minimum height and a 13px radius. Saving disables the form action and sign-out, shows the loading label, and retains the draft after an error. Invalid input returns focus to the amount and exposes the related error text.
- On entry, focus moves to the question. After a successful write and loaded transaction, a focusable status announces the same persisted amount once. Its 220ms arrival moves 4px and clears a 2px blur; reduced motion removes that animation.
- The registration view reached after saving begins with its existing heading and explanation, without the removed decorative eyebrow.

## Finish evidence

The bounded finish review is `.impeccable/review/onboarding-review.md`: all three findings resolved, `remaining: Clear`, `disposition: ship`. That verdict covers the fixes identified in the first pass, not a new audit of the entire application. Existing captures are local review evidence only: `onboarding-desktop.png`, `onboarding-mobile.png`, `onboarding-mobile-320.png`, `onboarding-mobile-max.png` and `onboarding-success-mobile.png`, all under `.impeccable/review/`. No production raster assets were introduced.

Implementation validation reported by the parent task: 28 logic/database checks and 15 UI checks pass; lint and build pass. This documentation pass did not rerun those checks or open another visual review. The remote database migration remains unapplied and will be run by the owner.
