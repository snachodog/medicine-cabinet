<!-- markdownlint-disable MD041 -->
[![Dependabot Updates](https://github.com/snachodog/medicine-cabinet/actions/workflows/dependabot/dependabot-updates/badge.svg?branch=main)](https://github.com/snachodog/medicine-cabinet/actions/workflows/dependabot/dependabot-updates)

# Medicine Cabinet

**Medicine Cabinet** is a self-hosted web app for tracking your household's medications, prescriptions, and dose history — running entirely on your own server.

Inspired by tools like [Snipe-IT](https://snipeitapp.com/), it treats medications as trackable assets assigned to people. Built for families, caregivers, or anyone managing health items at home.

---

## Current Features

### Household & Profiles

- **Multi-person households** — manage medications for multiple people under one account
- **Household sharing** — grant other accounts access to a person's records by username; revoke at any time
- **Person profiles** — store allergies and notes per household member
- **Allergy tracking** — allergy information is prominently displayed and included in PDF exports

### Medications & Prescriptions

- **Medication management** — create, edit, and deactivate medications with name, dosage, type (OTC / supplement / Rx), schedule, and notes
- **Prescription tracking** — link prescriptions to Rx medications; track fill dates, scripts remaining, next eligible date, expiration date, prescriber, pharmacy, and co-pay
- **Dose logging** — record when doses are taken; view history per medication
- **Medication catalog** — search a built-in drug reference to pre-fill medication fields by name or barcode (UPC)

### Contacts

- **Provider directory** — save prescribers with specialty, phone, address, and website; autofills prescription forms
- **Pharmacy directory** — save pharmacies with contact info; autofills prescription forms

### Exports & Integrations

- **PDF medication report** — generate a printable report per person listing all active medications, suitable for handing to a provider or emergency services
- **Calendar feed (ICS)** — subscribe to a per-account `.ics` feed in any calendar app (Google Calendar, Apple Calendar, Outlook) with pickup events and refill reminders; or download a one-time snapshot

### Notifications & Reminders

- **Email alerts** — receive email warnings 7 and 30 days before a prescription's expiration date (requires SMTP configuration)
- **ntfy push notifications** — send refill reminders and low-script alerts to any [ntfy](https://ntfy.sh/) topic
- **Refill reminders** — configurable advance notice before a prescription's next eligible pickup date
- **Expiration highlighting** — prescriptions approaching or past expiration are flagged in the UI

### Access & Account Management

- **Local accounts** — username/password registration with strength requirements (8+ chars, upper, lower, digit, special)
- **SSO / OIDC login** — optional single sign-on via any OpenID Connect provider (Google, Authentik, Keycloak, etc.)
- **Toggleable registration** — open registration (default) or invite-only mode controlled by an environment variable
- **Invite codes** — logged-in users can generate single-use invite codes with optional expiry; required when registration is closed
- **Account self-service** — users can change their username and password from the Account settings tab
- **httpOnly cookie auth** — JWT stored in a secure httpOnly SameSite=Lax cookie; never exposed to JavaScript
- **Token revocation** — logout invalidates the session token immediately
- **Rate limiting** — login and registration endpoints are rate-limited to prevent brute force

### Security & Administration

- **Audit log** — all create/update/delete events are logged and visible to account holders
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` applied on every response

### Developer / API

- **REST API** — all data accessible via the FastAPI backend; interactive docs at `/api/docs`
- **Alembic migrations** — schema migrations run automatically on startup; no manual steps

---

## Tech Stack

| Layer        | Technology                                 |
|--------------|--------------------------------------------|
| Frontend     | React 18 + React Router 7 + Tailwind CSS 4 |
| Backend      | FastAPI (Python 3.12)                      |
| ORM          | SQLAlchemy                                 |
| Migrations   | Alembic (auto-runs on startup)             |
| Database     | PostgreSQL 15                              |
| Self-hosting | Docker + Docker Compose                    |
| Image        | `dogiakos/medicine-cabinet:latest`         |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Download the compose file

```bash
curl -O https://raw.githubusercontent.com/snachodog/medicine-cabinet/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/snachodog/medicine-cabinet/main/.env.example
```

Or clone the repo:

```bash
git clone https://github.com/snachodog/medicine-cabinet.git
cd medicine-cabinet
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`. At minimum, set secure values for the database password and JWT secret:

```bash
openssl rand -hex 24   # for POSTGRES_PASSWORD
openssl rand -hex 32   # for SECRET_KEY
```

Your minimal `.env`:

```env
POSTGRES_PASSWORD=your-strong-password
POSTGRES_USER=medicabinet
POSTGRES_DB=medicabinet_db
SECRET_KEY=your-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

See the [Configuration reference](#configuration-reference) below for all available options.

### 3. Start

```bash
docker compose up -d
```

Database migrations run automatically on startup.

### 4. Open the app

- **App:** <http://localhost:8000>
- **API docs:** <http://localhost:8000/api/docs>

Register the first account on the login page.

### Updating

```bash
docker compose pull
docker compose up -d
```

Migrations are applied automatically — no manual steps required between versions.

---

## Configuration Reference

All configuration is via environment variables in `.env`. Only the required variables are needed for basic operation; everything else is optional.

### Required

| Variable            | Description                                   |
|---------------------|-----------------------------------------------|
| `POSTGRES_PASSWORD` | Database password                             |
| `SECRET_KEY`        | JWT signing secret — use a long random string |

### Optional — Core

| Variable                      | Default          | Description                                          |
|-------------------------------|------------------|------------------------------------------------------|
| `POSTGRES_USER`               | `medicabinet`    | Database username                                    |
| `POSTGRES_DB`                 | `medicabinet_db` | Database name                                        |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60`             | How long login sessions last                         |
| `REGISTRATION_ENABLED`        | `true`           | Set to `false` to require an invite code to register |

### Optional — SSO / OIDC

All three OIDC variables must be set to enable SSO. The login page shows an SSO button automatically when enabled.

| Variable             | Description                                              |
|----------------------|----------------------------------------------------------|
| `OIDC_ISSUER`        | Provider discovery base URL (e.g. accounts.google.com)   |
| `OIDC_CLIENT_ID`     | Client ID from your identity provider                    |
| `OIDC_CLIENT_SECRET` | Client secret from your identity provider                |
| `OIDC_PROVIDER_NAME` | Label shown on the SSO button (default: `SSO`)           |
| `OIDC_SCOPES`        | Space-separated scopes (default: `openid email profile`) |

Your identity provider's redirect URI must be set to:

```text
http(s)://your-domain/api/auth/oidc/callback
```

### Optional — Email notifications

All five SMTP variables must be set to enable email alerts.

| Variable        | Description                                        |
|-----------------|----------------------------------------------------|
| `SMTP_HOST`     | SMTP server hostname, e.g. `smtp.gmail.com`        |
| `SMTP_PORT`     | SMTP port (default: `587`)                         |
| `SMTP_USER`     | SMTP login username                                |
| `SMTP_PASSWORD` | SMTP login password                                |
| `SMTP_FROM`     | From address for outgoing emails                   |

Once configured, users opt in per-account under **Settings → Notifications** and provide their email address there.

---

## Roadmap

### Future ideas

- [ ] CSV import/export for bulk medication management
- [ ] Dashboard view — expiring prescriptions, upcoming refills, recent activity at a glance
- [ ] Mobile PWA — offline-capable client for logging doses on the go
- [ ] Barcode scanning — camera-based UPC lookup to pre-fill medication fields in the UI
- [ ] Password reset via email

---

## Privacy & Security

Medicine Cabinet is designed to be **self-hosted** so sensitive health data stays on your own server and never passes through a third-party service. You control the database, the backups, and who has access.

### What is protected

| Protection | Details |
| --- | --- |
| **Passwords** | Stored as bcrypt hashes with a random salt. Plaintext passwords are never written to disk and cannot be recovered from the database. |
| **User isolation** | Every API request verifies that the requesting account has been granted access to the person's data. One user cannot read another's medications, logs, or prescriptions unless explicitly shared. |
| **Auth cookies** | JWT session tokens are stored in `HttpOnly`, `SameSite=Lax` cookies - not accessible to JavaScript. The `Secure` flag is enabled by default (`COOKIE_SECURE=true`) so cookies are only transmitted over HTTPS. |
| **Token revocation** | Logging out immediately invalidates the session token. |
| **Rate limiting** | Login and registration endpoints are rate-limited to slow brute-force attempts. |
| **Transport** | The app is intended to be served behind a TLS-terminating reverse proxy (e.g. Cloudflare, nginx). Running it on plain HTTP is only appropriate for local development. |

### What is NOT protected

**Medication data is stored as plaintext in the database.** This includes medication names, doses, schedules, dose logs, prescriptions, fill history, and notes.

This means:

- Anyone with direct database access (the server operator, a compromised host) can read all user data
- A database backup or dump contains all data in readable form
- There is no end-to-end encryption - the server sees everything

This is a deliberate trade-off common to self-hosted web apps. It is appropriate for personal or family use on a server you control, but you should disclose this to anyone you invite to use your instance.

### Recommendations for self-hosters

- **Enable HTTPS** - run behind Cloudflare, Caddy, or an nginx reverse proxy with a TLS certificate. Do not expose port 8000 directly to the internet.
- **Enable disk/volume encryption** on the host so database files on disk are protected if physical media is seized or lost.
- **Restrict database access** - the Postgres port is not published externally by default in `docker-compose.yml`. Keep it that way.
- **Keep backups encrypted** - if you back up the Postgres volume, encrypt the backup at rest.
- **Use a strong `SECRET_KEY`** - generate with `openssl rand -hex 32`. Rotating it invalidates all active sessions.

### OIDC / SSO note

OIDC accounts are provisioned on first login using the verified email address returned by the identity provider. No unverified auto-provisioning occurs. The identity provider is responsible for authenticating the user - Medicine Cabinet trusts the claims in the OIDC token.

---

## License

[MIT](LICENSE) — © 2025 Steven Dogiakos

---

## Acknowledgments

- [Snipe-IT](https://snipeitapp.com/) for the asset/consumable management model
- The open-source community that makes self-hosting practical
