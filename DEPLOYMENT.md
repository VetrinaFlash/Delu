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

### Payment lifecycle

1. The browser sends product IDs, variants, quantity, customer and shipping data to `/api/checkout/nexi`.
2. The server reloads current product prices/stock from D1 and recalculates shipping. Browser totals are never trusted.
3. The order is created as `Pagamento in attesa`; stock is **not** reduced yet.
4. The server creates the Nexi HPP and stores the returned `securityToken`.
5. Nexi redirects the customer to the hosted page.
6. Nexi sends a server-to-server notification to `/api/payments/nexi/notification`.
7. The stored `securityToken`, amount and currency are verified.
8. Only an `EXECUTED` operation is treated as paid. An `AUTHORIZED` operation is not treated as a final captured payment.
9. Variant stock is decremented conditionally. Concurrent purchases cannot silently push stock below zero.
10. If paid stock can no longer be allocated, the order becomes `Pagato - verifica stock` for manual intervention rather than losing the payment event.
11. The browser return page independently polls `/api/payments/nexi/status` to obtain the definitive state from the server/Nexi.

Test successful payment, decline, cancellation, 3DS failure, repeated notification and browser refresh in sandbox before enabling production.

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

Paid orders decrement the matching variant. The product-level total stock is synchronized from its variants.

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
