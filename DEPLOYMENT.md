# Thelu Clothes Shop — Cloudflare setup

The project is structured for Cloudflare Pages + Pages Functions + D1.

## 1. Frontend build

Cloudflare Pages settings:

- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

## 2. Create the D1 database

```bash
npx wrangler d1 create thelu-shop
```

Apply the schema:

```bash
npx wrangler d1 execute thelu-shop --remote --file=database/schema.sql
```

In Cloudflare Pages open **Settings → Bindings → Add → D1 database**, select the database and use this exact variable name:

```text
DB
```

The Functions code expects `context.env.DB`.

## 3. Admin credentials

Create a SHA-256 hash of the password you want to use:

```bash
node -e "const {createHash}=require('crypto'); console.log(createHash('sha256').update(process.argv[1]).digest('hex'))" "YOUR_PASSWORD"
```

Generate a random session signing secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

In **Settings → Variables and Secrets**, configure production and preview values for:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_SHA256`
- `AUTH_SECRET`

Do not commit the real password, hash or session secret to GitHub.

## 4. Pages Functions

The API lives at:

```text
/functions/api/[[path]].ts
```

Main endpoints:

- `GET /api/products` — public catalog
- `POST /api/orders` — create an order and reduce stock
- `POST /api/auth/login` — private staff login
- `GET /api/auth/me` — validate staff session
- `POST /api/auth/logout` — destroy staff session
- `GET /api/admin/products` — full catalog
- `POST /api/admin/products` — create product
- `PATCH /api/admin/products/:id` — edit product / stock
- `DELETE /api/admin/products/:id` — hide product
- `GET /api/admin/orders` — order management
- `PATCH /api/admin/orders/:id` — change order status

## 5. First catalog

Until D1 contains products, the public shop intentionally displays demo content so the website remains visually complete. As soon as D1 contains at least one active product, the public storefront hydrates from `/api/products`.

## 6. Brand assets

The temporary wordmark and editorial photography are placeholders. Replace them after the official Thelu logo and real product photography are supplied.
