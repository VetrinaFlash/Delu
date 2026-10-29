# DeLù Clothes Shop — Go-live checklist

Use this list before accepting real customer payments.

## Required external information

- [ ] Confirm the merchant's exact legal business name.
- [ ] Confirm VAT / tax number and any required company registration details.
- [ ] Confirm official customer-service email address.
- [ ] Confirm the exact privacy notice / data-controller details.
- [ ] Confirm whether a cookie banner is legally required by the final analytics/marketing setup.
- [ ] Confirm terms and conditions of sale.
- [ ] Confirm the official returns/withdrawal policy and return address.
- [ ] Confirm shipping countries, courier, delivery times and final commercial rates.

The repository intentionally does **not** invent these legal or commercial details.

## Cloudflare

- [ ] Pages project connected to `VetrinaFlash/Delu`, production branch `main`.
- [ ] Build command `npm run build`, output `dist`.
- [ ] D1 binding named `DB`.
- [ ] R2 bucket binding named `PRODUCT_IMAGES`.
- [ ] D1 schema applied.
- [ ] Custom domain connected with HTTPS.
- [ ] `SITE_URL` matches the canonical HTTPS origin exactly.

## Admin security

- [ ] Set `ADMIN_EMAIL` as a Cloudflare secret/variable.
- [ ] Generate and set `ADMIN_PASSWORD_SHA256` from a long unique password.
- [ ] Generate a random 32-byte-or-longer `AUTH_SECRET`.
- [ ] Verify `/admin` rejects invalid sessions.
- [ ] Verify admin credentials are not present in GitHub or frontend bundles.

## Nexi XPay sandbox

- [ ] Set sandbox `NEXI_XPAY_API_KEY`.
- [ ] Set the sandbox `NEXI_XPAY_BASE_URL`.
- [ ] Complete a successful card payment.
- [ ] Test a declined payment.
- [ ] Test a cancelled checkout.
- [ ] Test 3DS failure/challenge flow where available.
- [ ] Verify the order remains `Pagamento in attesa` before payment execution.
- [ ] Verify stock changes only after an `EXECUTED` payment.
- [ ] Verify duplicate/repeated notifications do not subtract stock twice.
- [ ] Verify wrong `securityToken`, amount or currency is rejected.
- [ ] Verify the browser result page shows success only after server confirmation.

## Nexi production

- [ ] Obtain/enable the production merchant API key.
- [ ] Use the production base URL supplied for the merchant contract.
- [ ] Replace sandbox credentials only in Cloudflare secrets, never in GitHub.
- [ ] Make a low-value real production transaction and reconcile it in Nexi back office.

## Catalog and inventory

- [ ] Replace all demo products/photos with real DeLù catalog data.
- [ ] Upload multiple high-resolution product photos.
- [ ] Verify every size/color combination has the correct stock.
- [ ] Check sold-out variants are disabled on the storefront.
- [ ] Check product tags, New In and DeLù Edit assignments.
- [ ] Verify mobile image cropping for every hero/editorial image.

## Languages

- [ ] Review IT copy.
- [ ] Native/professional review of EN copy.
- [ ] Native/professional review of FR copy.
- [ ] Native/professional review of DE copy.
- [ ] Native/professional review of ES copy.
- [ ] Confirm product descriptions supplied by the merchant are suitable for the languages in which they will be displayed.

## Shipping and fulfillment

- [ ] Set final Italy rate/free-shipping threshold in Admin → Impostazioni.
- [ ] Set final EU rate/free-shipping threshold.
- [ ] Set final extra-EU Europe rate.
- [ ] Set final worldwide rate.
- [ ] Confirm which non-EU destinations are actually accepted by the courier.
- [ ] Test an Italian address.
- [ ] Test an EU address.
- [ ] Test an extra-EU address and customs notice.
- [ ] Verify carrier/tracking details can be saved on an order.

## Storefront QA

- [ ] Home desktop.
- [ ] Home mobile.
- [ ] Language selector on desktop/mobile.
- [ ] Search overlay.
- [ ] Wishlist persistence.
- [ ] Cart persistence and quantity limits.
- [ ] Filters: category, color, size, New In, DeLù Edit.
- [ ] Product gallery.
- [ ] Variant availability and sold-out behavior.
- [ ] Checkout validation.
- [ ] Payment result page and cart clearing after confirmed payment.
- [ ] Shipping page.
- [ ] Returns/support page.
- [ ] Footer store/contact information.

## Final technical check

- [ ] Latest GitHub Actions run is green: frontend build + Pages Function type-check.
- [ ] No browser console errors on production.
- [ ] No failed API calls during normal browsing.
- [ ] Security headers are present.
- [ ] `/admin` and `/api/` are excluded from indexing.
- [ ] Test on current iPhone Safari, Android Chrome and desktop Chrome/Safari/Edge.
