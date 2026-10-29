# DeLù Clothes Shop — Cloudflare + Nexi setup

The project is structured for Cloudflare Pages + Pages Functions + D1, with a multilingual storefront and Nexi XPay Hosted Payment Page checkout.

## 1. Frontend build

Cloudflare Pages settings:

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

The public storefront supports Italian, English, French, German and Spanish. The selected language is stored in the browser and is also passed to Nexi when the hosted checkout is created.

## 2. Create the D1 database

```bash
npx wrangler d1 create delu-shop
```

Apply the schema:

```bash
npx wrangler d1 execute delu-shop --remote --file=database/schema.sql
```

In Cloudflare Pages open **Settings → Bindings → Add → D1 database**, select the database and use this exact variable name:

```text
DB
```

## 3. Admin credentials

Create a SHA-256 hash of the private admin password:

```bash
node -e "const {createHash}=require('crypto'); console.log(createHash('sha256').update(process.argv[1]).digest('hex'))" "YOUR_PASSWORD"
```

Generate a session signing secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set these production/preview secrets in **Settings → Variables and Secrets**:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_SHA256`
- `AUTH_SECRET`

## 4. Nexi XPay

The integration uses the Nexi XPay Hosted Payment Page. The API key is never exposed to the browser.

Set:

- `NEXI_XPAY_API_KEY` — merchant API key from Nexi
- `NEXI_XPAY_BASE_URL` — sandbox while testing: `https://xpaysandbox.nexigroup.com/api/phoenix-0.0/psp`
- `SITE_URL` — canonical public origin, for example `https://shop.example.it`

Checkout flow:

1. `/api/checkout/nexi` recalculates cart prices and shipping on the server.
2. An order is created as **Pagamento in attesa** without reducing stock.
3. The server creates the Nexi Hosted Payment Page and returns its redirect URL.
4. Nexi calls `/api/payments/nexi/notification` server-to-server.
5. The notification `securityToken` is compared with the token stored when the payment session was created.
6. On a confirmed paid result, stock is reduced and the order becomes **Nuovo**.
7. `/api/payments/nexi/status` can independently retrieve the order status from Nexi after the browser returns.

For production, replace the sandbox base URL with the production base URL supplied/enabled for the merchant by Nexi.

## 5. Shipping zones

Current defaults are intentionally centralized in both checkout UI and server validation:

- Italy: €6.90, free from €79
- EU: €14.90, free from €150
- Europe outside the EU: €19.90
- Rest of world: €29.90

These are launch defaults, not hard-coded commercial assumptions: edit them before going live if the store uses different courier pricing. The authoritative total is always calculated server-side.

## 6. API

Public/payment endpoints:

- `GET /api/products`
- `POST /api/checkout/nexi`
- `POST /api/payments/nexi/notification`
- `GET /api/payments/nexi/status?orderId=...`

Private endpoints:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PATCH /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id`

## 7. Brand

The supplied DeLù logo is stored as `public/delu-logo.svg` and is used in header, mobile navigation, footer and browser metadata. The second PDF page was not used as a footer design; only store/contact information was taken from it.
