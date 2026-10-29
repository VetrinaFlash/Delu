# DeLù Clothes Shop

Premium multilingual fashion e-commerce for **DeLù Clothes Shop — Follonica**, with a private commerce back office.

## Stack

- React + TypeScript + Vite
- Motion for React
- React Router
- Cloudflare Pages + Pages Functions
- Cloudflare D1 for catalog, orders, inventory and settings
- Cloudflare R2 for product imagery
- Nexi XPay Hosted Payment Page

## Storefront

- Premium responsive home and editorial animations
- IT / EN / FR / DE / ES language selector
- Product search, wishlist and persistent cart
- New-in and DeLù Edit collections
- Category, color and size filters
- Product galleries and stock-aware size/color variants
- International checkout with server-authoritative shipping rates
- Nexi XPay redirect, server notification validation and payment polling
- Shipping and returns information pages
- SEO/social metadata, security headers and web-app manifest

## Private back office

- Signed HttpOnly admin session
- Product creation and editing
- Multi-image upload via R2
- Per-color/per-size inventory
- Tags, categories, featured/new/visible flags
- Orders, customer/shipping details and status management
- Courier and tracking management
- Editable international shipping rates

See `DEPLOYMENT.md` and `GO_LIVE_CHECKLIST.md` before production launch.
