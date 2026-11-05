# DeLù Clothes Shop — Cloudflare + Nexi production setup

The application is designed for **Cloudflare Pages + Pages Functions + D1 + R2**, with Nexi XPay Hosted Payment Page checkout.

## 1. Cloudflare Pages

Use:

- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Node.js: 22 or newer

The storefront supports Italian, English, French, German and Spanish. The selected language is persisted in the browser and passed to Nexi when a payment session is created.

## 2. D1 database

Create the database:

```bash
npx wrangler d1 create delu-shop
```

Apply the full schema on a new database:

```bash
npx wrangler d1 execute delu-shop --remote --file=database/schema.sql
```

In the Pages project add a **D1 binding** named exactly:

```text
DB
```

The API also creates the newer commerce tables idempotently, so an existing installation can be upgraded without deleting catalog/orders data. The checked-in schema remains the source of truth for fresh environments.

## 3. R2 product images

Create an R2 bucket, for example:

```text
delu-product-images
```

Add it to the Pages project as an **R2 binding** named exactly:

```text
PRODUCT_IMAGES
```

The admin product editor accepts JPEG, PNG, WEBP and AVIF files up to 8 MB. Files are stored in R2 and served through `/api/media/*`. The upload endpoint is private and requires a valid admin session.

Without this binding the rest of the shop still works, but direct image upload returns a configuration error; external image URLs remain available as a fallback.

## 4. Admin authentication

Create a SHA-256 hash for the private admin password:

```bash
node -e "const {createHash}=require('crypto'); console.log(createHash('sha256').update(process.argv[1]).digest('hex'))" "YOUR_PASSWORD"
```

Generate a strong session signing secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Configure these as Cloudflare production/preview secrets:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_SHA256`
- `AUTH_SECRET`

Never commit real credentials or hashes to GitHub.

## 5. Nexi XPay

The checkout uses the **Nexi XPay Hosted Payment Page**. Card details never pass through DeLù's frontend and the merchant API key stays server-side.

Configure:

- `NEXI_XPAY_API_KEY` — merchant API key supplied by Nexi
- `NEXI_XPAY_BASE_URL` — sandbox while testing: `https://xpaysandbox.nexigroup.com/api/phoenix-0.0/psp`
- `SITE_URL` — canonical HTTPS origin of the live shop

Use the production base URL enabled for the specific merchant contract when moving out of sandbox; do not guess or hard-code it from another merchant.

### Payment lifecycle (immediate payment, no manual approval)

1. Customer chooses the actual available color/size and proceeds directly to checkout.
2. Server reads authoritative prices, discounts and variant stock from D1 and calculates shipping.
3. One transactional D1 batch creates a pending order and reserves its exact quantities by subtracting them from public stock. If any product is sold out at that instant, the **whole transaction rolls back**; Nexi is never contacted.
4. The server creates a Nexi Hosted Payment Page (HPP) and stores the returned securityToken **only on the server**.
5. The browser redirects directly to Nexi. There is no WhatsApp approval or payment link to be shared.
6. After an EXECUTED operation is confirmed through the authenticated webhook or server-side GET order-status endpoint, the reservation becomes a sale and the order becomes Pagato - da preparare. No second deduction happens.
7. A failed/canceled payment releases its reservation exactly once, restoring product/variant quantities.
8. Unfinished sessions are reclaimed after 45 minutes, by checking Nexi's authoritative status first. Nexi HPP links last 15 minutes; the longer hold allows authentication and notification delays. If Nexi is unavailable, the hold remains pending until safe reconciliation.
9. The admin cannot overwrite a reserved product's stock/variants or mark an unpaid order as shipped.
10. Older manual-review orders retain their legacy flow to avoid breaking already-issued payment links. New checkouts never use it.

The merchant key must be configured on Cloudflare. Official production API root: https://xpay.nexigroup.com/api/phoenix-0.0/psp. Confirm the merchant's production HPP contract is active and never use sandbox credentials on the live endpoint.

Automated tests mock Nexi, so perform a real sandbox card payment and return/refund test before accepting live card payments.

## 6. Shipping

Default launch values are:

- Italy: €6.90 — free from €79
- European Union: €14.90 — free from €150
- Europe outside EU: €19.90
- Rest of world: €29.90

They are **not hard-coded business rules anymore**. The merchant can change them from `Admin → Impostazioni`; D1 stores the configuration and both storefront and checkout server use the same authoritative values.

For extra-EU destinations the storefront warns that customs duties/import taxes may be charged by local authorities. The exact countries served and commercial rates should be confirmed with the store's courier before launch.

## 7. Inventory model

Products support:

- multiple images
- colors
- sizes
- stock for every color/size combination
- tags and category filters
- featured/new/visible flags
- legacy total-stock products for backwards compatibility

Stock is reserved at checkout, removed from public availability while Nexi is in progress, then permanently consumed after verified payment. Failed, canceled or expired sessions restore stock. Product-level total stock stays synchronized with its variants, and active reservations block stock rewrites from the editor.

## 8. Order fulfillment

The private order drawer stores:

- order status
- carrier
- tracking code
- tracking URL
- customer contact
- destination
- order notes

The project intentionally does not invent a courier API: carrier credentials/contracts must be known before automating label creation or tracking emails.

## 9. Main API routes

Public:

- `GET /api/products`
- `GET /api/config`
- `GET /api/media/*`
- `POST /api/checkout/nexi`
- `POST /api/payments/nexi/notification`
- `GET /api/payments/nexi/status?orderId=...`

Private:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `POST /api/admin/upload`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`

## 10. Brand source

`public/delu-logo.svg` is based on the logo supplied in page 1 of the client PDF. Page 2 was **not** copied as a footer design; only the useful store/contact information was used.

## 11. Before production

Complete every item in `GO_LIVE_CHECKLIST.md`. In particular, production should not be opened to customers until the merchant's exact legal identity/VAT information, privacy notice, cookie requirements, terms of sale and final returns policy have been supplied and reviewed. Those details are not fabricated by the codebase.
