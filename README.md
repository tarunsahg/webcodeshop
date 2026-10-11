# WebCodeShop

A modern full-stack code marketplace built with **Next.js 14** (App Router) and **SQLite**.
Sell PHP/HTML/JS/WP/Giftcard products with a polished customer storefront and a complete admin panel.

---

## ⚡️ Quick start

```bash
npm install
cp .env.example .env.local   # optional — fill in only what you need
npm run dev
```

Open http://localhost:3000

### Demo accounts (auto-seeded)

| Role     | Email                      | Password    |
| -------- | -------------------------- | ----------- |
| Customer | `buyer@demo.com`           | `demo123`   |
| Admin    | `admin@webcodeshop.dev`    | `admin123`  |

Admin sign-in is at `/admin/login`.

---

## 🔑 Google Sign-In

The app supports **"Continue with Google"** on both the login and register pages.

### Set up your own Google OAuth client

1. Visit [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Click **“+ Create credentials”** → **“OAuth client ID”** → application type **“Web application”**.
3. Add an **Authorized redirect URI**:
   - Development: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
4. Copy the **Client ID** and **Client secret** into `.env.local`:
   ```env
   GOOGLE_CLIENT_ID=xxxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   APP_URL=http://localhost:3000
   ```
5. Restart the dev server.

**What happens when a user signs in with Google:**
- If their Google email matches an existing account, the accounts are linked.
- Otherwise a new local user is created (with a random password, since they'll sign in via Google).
- A welcome email is sent (or logged to `./data/mail/` if no email provider is configured).
- A signed HTTP-only session cookie is set, same as a regular login.

If `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are blank, the Google button still shows but returns a clear “not configured” message — nothing crashes.

---

## ✉️ Email delivery

The app uses an abstracted mail service (see `lib/mailer.js`) with two modes:

- **Development** (default): emails are saved as text files to `./data/mail/*.txt` and logged to the console. Perfect for local testing.
- **Production**: set `RESEND_API_KEY` (https://resend.com) and `MAIL_FROM` to send real emails.

Emails are sent automatically for:
- New user signup (welcome)
- New order (receipt with license keys)
- Password reset

Every send is recorded in the `email_log` table.

---

## 🗄️ Architecture

- **Framework**: Next.js 14 App Router (React Server Components + Client Components)
- **Database**: SQLite via `better-sqlite3` at `./data/webcodeshop.db` (auto-created and seeded on first run)
- **Auth**: HMAC-signed session cookie (`wcs_session`), 7-day expiry. Passwords hashed with `crypto.scryptSync`.
- **OAuth**: Google OAuth 2.0 (`openid email profile`) with CSRF state validation.
- **Email**: Resend API in production, file-log fallback in development.
- **Styling**: Modern hand-tuned CSS with design tokens, scroll-reveal animations, glassmorphism.

### Folder layout

```
app/
  api/
    auth/
      login, register, logout, me, admin-login
      google/                # GET starts OAuth
      google/callback/       # GET handles Google redirect
      password-reset/        # request, confirm
      profile/               # PATCH name/password
    products/                # GET/POST + [id]
    orders/                  # GET/POST + [id]
    coupons/                 # GET/POST + [id], validate
    users/                   # admin list + delete
    settings/                # GET/PUT
    analytics/               # GET
    reviews/                 # GET/POST/DELETE
    wishlist/                # GET/POST/DELETE
    search/                  # GET ?q=
    download/[code]/         # GET license-gated download
  account/                   # customer dashboard + profile
  admin/                     # admin panel
  cart/  checkout/  login/  register/  shop/  product/[id]/
  forgot-password/  reset-password/  wishlist/
components/                  # Providers, Nav, Footer, ProductCard, etc.
lib/
  db.js                      # SQLite setup, schema, seed
  seed.js                    # demo products/coupons
  auth-server.js             # session token helpers
  oauth-google.js            # Google OAuth flow
  mailer.js                  # Resend + dev file log
  api-utils.js               # JSON response helpers
  format.js                  # client-side formatters
```

---

## 📑 API endpoints

| Method | Path                                       | Auth        | Purpose                                  |
| ------ | ------------------------------------------ | ----------- | ---------------------------------------- |
| POST   | `/api/auth/login`                          | public      | Email + password sign in                 |
| POST   | `/api/auth/register`                       | public      | Create new customer account              |
| POST   | `/api/auth/admin-login`                    | public      | Admin sign in                            |
| POST   | `/api/auth/logout`                         | any         | Clear session                            |
| GET    | `/api/auth/me`                             | any         | Current user (or null)                   |
| GET    | `/api/auth/google`                         | public      | Redirect to Google consent screen        |
| GET    | `/api/auth/google/callback`                | public      | Handle Google redirect, set session      |
| POST   | `/api/auth/password-reset/request`         | public      | Email a reset link                       |
| POST   | `/api/auth/password-reset/confirm`         | public      | Set new password from token              |
| PATCH  | `/api/auth/profile`                        | user        | Update name / change password            |
| GET\|POST | `/api/products`                         | public/admin| List or create products                  |
| GET\|PUT\|DELETE | `/api/products/[id]`             | public/admin| Read, update, delete                     |
| GET\|POST | `/api/orders`                           | user        | List own orders / place order            |
| GET\|PATCH\|DELETE | `/api/orders/[id]`             | user/admin  | Read, status change, delete              |
| GET\|DELETE | `/api/users` / `[id]`                 | admin       | List, delete customers                   |
| GET\|POST | `/api/coupons`                          | public/admin| List active, create                      |
| PATCH\|DELETE | `/api/coupons/[id]`                 | admin       | Toggle, delete                           |
| POST   | `/api/coupons/validate`                    | public      | Validate a coupon for a subtotal         |
| GET\|PUT | `/api/settings`                          | public/admin| Read, update                             |
| GET    | `/api/analytics`                           | admin       | Sales, revenue, top products             |
| GET\|POST\|DELETE | `/api/reviews`                  | user        | Read product reviews, post, delete       |
| GET\|POST\|DELETE | `/api/wishlist`                 | user        | List, toggle, remove                     |
| GET    | `/api/search?q=`                           | public      | Full-text product search                 |
| GET    | `/api/download/[code]`                     | owner/admin | Download by license key                  |

---

## 🗃️ Database schema

| Table             | Purpose                                                        |
| ----------------- | -------------------------------------------------------------- |
| `users`           | Local + OAuth users (name, email, password, role, avatar, provider) |
| `oauth_accounts`  | Links Google (or future providers) to a `users` row            |
| `password_resets` | One-time reset tokens with expiry                              |
| `products`        | Catalog                                                        |
| `orders`          | Customer orders                                                |
| `order_items`     | Line items per order                                           |
| `license_keys`    | Auto-generated keys delivered per quantity                     |
| `coupons`         | Percent / fixed-amount discounts with active flag and usage    |
| `settings`        | Brand name, accent color, etc.                                 |
| `reviews`         | One per `(product, user)`; auto-recomputes product rating      |
| `wishlist`        | `(user, product)` pairs                                        |
| `email_log`       | Audit log of every email send (template, provider, sent_at)    |

The database file is auto-created at `./data/webcodeshop.db` on first request and seeded with sample products + the demo coupon `WELCOME10`.

---

## 🛠️ Production checklist

- [ ] Set a strong `WCS_SECRET` (long random string)
- [ ] Set `APP_URL` to your real domain (used in email links + OAuth redirect default)
- [ ] Set `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` and add the production redirect URI in Google Console
- [ ] Set `RESEND_API_KEY` + verified `MAIL_FROM` domain
- [ ] Run behind HTTPS — the session cookie automatically becomes `Secure` in `NODE_ENV=production`
- [ ] Change the seeded admin password by editing the user via the admin panel (or directly in SQLite)
- [ ] Add a real product file delivery layer behind `/api/download/[code]` (currently serves a demo artifact)

---

## 🔐 Security notes

- Sessions use HMAC-signed payloads (no JWT lib needed), HTTP-only cookies, 7-day expiry.
- Password reset tokens are single-use and expire in 1 hour.
- Google OAuth uses a CSRF state nonce stored in a separate cookie and matched on callback.
- Email enumeration is prevented in `password-reset/request` (always returns success).
- All admin routes call `requireAdmin()`; user-scoped routes call `requireUser()`.
- Reviews require a logged-in user; one review per `(user, product)` (upsert).

---

Built with care. Code. Templates. Scripts. Solutions. — **WebCodeShop**
