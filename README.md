<!-- markdownlint-disable MD041 -->
[![Dependabot Updates](https://github.com/snachodog/medicine-cabinet/actions/workflows/dependabot/dependabot-updates/badge.svg?branch=main)](https://github.com/snachodog/medicine-cabinet/actions/workflows/dependabot/dependabot-updates)

# Medicine Cabinet

Medicine Cabinet is a self-hosted web app for keeping track of your household's medications, prescriptions, and doses. Everything runs on your own server.

The idea comes from asset trackers like [Snipe-IT](https://snipeitapp.com/): each medication is an item assigned to a person. It's built for families, caregivers, and anyone who manages medications for more than one person at home.

---

## Features

### Household and profiles

- **Multiple people per account.** Track medications for everyone in the household from one login.
- **Sharing.** Give another account access to a person's records by username, and take it back whenever you want.
- **Profiles.** Keep allergies and notes for each person. Allergies show up prominently in the app and on PDF reports.

### Medications and prescriptions

- **Medications.** Add, edit, and deactivate medications with a name, dosage, type (OTC, supplement, or Rx), schedule, and notes.
- **Prescriptions.** Attach a prescription to any Rx medication to track fill dates, scripts remaining, next eligible date, expiration date, prescriber, pharmacy, and co-pay. Logging a fill counts down the scripts remaining.
- **Dose log.** Check off doses as they're taken, then look back through history and streaks for each medication.
- **Drug catalog.** Search the built-in drug reference to fill in medication details by name.

### Contacts

- **Providers.** Save prescribers with practice name, specialty, phone, address, and website.
- **Pharmacies.** Save pharmacies with their contact details.

Saved contacts autofill the prescription form.

### Exports and reminders

- **PDF report.** Print a list of a person's active medications and allergies to hand to a doctor or first responder.
- **Calendar feed.** Subscribe to a private `.ics` feed in Google Calendar, Apple Calendar, or Outlook to see pickup dates with a reminder ahead of each one. You can also download a one-time snapshot.
- **Expiration emails.** Get an email 30 days and 7 days before a prescription expires. This needs SMTP set up (see [Email notifications](#optional-email-notifications)).

### Accounts and sign-in

- **Local accounts.** Passwords need at least 8 characters with an uppercase letter, a lowercase letter, a number, and a special character.
- **Single sign-on.** Optionally sign in through any OpenID Connect provider, such as Google, Authentik, or Keycloak.
- **Open or invite-only registration.** Registration is open by default. Turn it off and new users need an invite code.
- **Invite codes.** Any signed-in user can create single-use invite codes, with an optional expiry.
- **Self-service.** Users can change their own username and password under **Settings > Account**.
- **Installable app.** Add it to your phone or desktop home screen. Pages you've already visited still load offline.
- **Dark mode.**

### Security and administration

- **Audit log.** Every create, update, and delete is recorded, and account holders can review it in Settings.
- **REST API.** Everything in the app is available through the API, with interactive docs at `/api/docs`.
- **Automatic migrations.** Database changes apply on startup, so upgrades don't need manual steps.

See [Privacy and security](#privacy-and-security) for how passwords, sessions, and data access are protected.

Planned features and known gaps are tracked as [enhancement issues](https://github.com/snachodog/medicine-cabinet/issues?q=is%3Aissue%20state%3Aopen%20label%3Aenhancement). Suggestions are welcome there too.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, React Router, Tailwind CSS, Vite |
| Backend | FastAPI (Python) |
| ORM | SQLAlchemy |
| Migrations | Alembic (runs on startup) |
| Database | PostgreSQL |
| Self-hosting | Docker and Docker Compose |
| Image | `dogiakos/medicine-cabinet:latest` |

Each [release](https://github.com/snachodog/medicine-cabinet/releases) is also published as a versioned image tag, for example `dogiakos/medicine-cabinet:1.2.1`, if you'd rather pin a version than follow `latest`.

---

## Getting started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Get the files

Download just the compose file and example config:

```bash
curl -O https://raw.githubusercontent.com/snachodog/medicine-cabinet/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/snachodog/medicine-cabinet/main/.env.example
```

Or clone the whole repo:

```bash
git clone https://github.com/snachodog/medicine-cabinet.git
cd medicine-cabinet
```

### 2. Configure

```bash
cp .env.example .env
```

Open `.env` and set a strong database password and JWT secret. These commands generate good ones:

```bash
openssl rand -hex 24   # POSTGRES_PASSWORD
openssl rand -hex 32   # SECRET_KEY
```

A minimal `.env` looks like this:

```env
POSTGRES_PASSWORD=your-strong-password
POSTGRES_USER=medicabinet
POSTGRES_DB=medicabinet_db
SECRET_KEY=your-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

> **Running locally over plain HTTP?** Add `COOKIE_SECURE=false` to `.env`. The login cookie is marked `Secure` by default, and browsers won't store a secure cookie over HTTP, so login fails without an error message. Leave it `true` (or unset) for anything reachable from the internet.

Every option is listed in the [configuration reference](#configuration-reference).

### 3. Start it

```bash
docker compose up -d
```

### 4. Open the app

- **App:** <http://localhost:8000>
- **API docs:** <http://localhost:8000/api/docs>

Create the first account from the login page.

### Updating

```bash
docker compose pull
docker compose up -d
```

Migrations run automatically when the new container starts.

---

## Configuration reference

All settings are environment variables in `.env`. Only the two required ones are needed to get running.

### Required

| Variable | Description |
| --- | --- |
| `POSTGRES_PASSWORD` | Database password |
| `SECRET_KEY` | Secret used to sign login tokens. Use a long random string. |

### Optional: core

| Variable | Default | Description |
| --- | --- | --- |
| `POSTGRES_USER` | `medicabinet` | Database username |
| `POSTGRES_DB` | `medicabinet_db` | Database name |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | How long a login lasts |
| `REGISTRATION_ENABLED` | `true` | Set to `false` to require an invite code to register |
| `COOKIE_SECURE` | `true` | Marks the login cookie `Secure` (HTTPS only). Set to `false` for local HTTP, or login will fail. |

### Optional: single sign-on (OIDC)

Set the first three variables to turn on SSO. The login page then shows an SSO button.

| Variable | Description |
| --- | --- |
| `OIDC_ISSUER` | Provider's discovery base URL, e.g. `https://accounts.google.com` |
| `OIDC_CLIENT_ID` | Client ID from your identity provider |
| `OIDC_CLIENT_SECRET` | Client secret from your identity provider |
| `OIDC_PROVIDER_NAME` | Label on the SSO button (default: `SSO`) |
| `OIDC_SCOPES` | Space-separated scopes (default: `openid email profile`) |
| `OIDC_REDIRECT_URI` | Full callback URL (default: built from the request) |

Register this redirect URI with your identity provider:

```text
http(s)://your-domain/api/auth/oidc/callback
```

Providers like Authentik and Keycloak require an exact match, scheme included. Behind a reverse proxy, the app builds the URL from the `X-Forwarded-Proto` and `X-Forwarded-Host` headers. If your proxy doesn't send those, or you see a redirect URI error, set `OIDC_REDIRECT_URI` to exactly what you registered. The app logs the URL it sends on every attempt (`Starting OIDC login with redirect_uri=...`), which helps when comparing.

### Optional: email notifications

Set all five variables to turn on email.

| Variable | Description |
| --- | --- |
| `SMTP_HOST` | SMTP server, e.g. `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port (default: `587`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_FROM` | From address on outgoing mail |

Each user then opts in and enters their address under **Settings > Notifications**. Expiration checks run once a day at 09:00 server time.

---

## Privacy and security

Medicine Cabinet is meant to be self-hosted, so health data stays on your server and never goes through a third-party service. You own the database, the backups, and the access list.

### What the app does

| Area | Details |
| --- | --- |
| **Passwords** | Stored as salted bcrypt hashes. Plaintext passwords are never saved and can't be recovered from the database. |
| **Data isolation** | Every API request checks that the account has access to the person it's asking about. Nobody sees another household's medications, logs, or prescriptions unless they've been shared. |
| **Login cookies** | Session tokens live in `HttpOnly`, `SameSite=Lax` cookies, so page scripts can't read them. The `Secure` flag is on by default. |
| **Logout** | Logging out revokes the token right away. Revocations are held in memory, so a container restart clears the list; tokens still expire after `ACCESS_TOKEN_EXPIRE_MINUTES`. |
| **Rate limiting** | Registration is limited to 5 attempts per minute and login to 10 per minute, per client. |
| **Security headers** | Every response sets `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, and `Referrer-Policy`. |

### What you should do

- **Put it behind HTTPS.** The container serves plain HTTP on port 8000. Run it behind Cloudflare, Caddy, or nginx with a TLS certificate, and don't expose port 8000 to the internet directly.
- **Encrypt the host disk** so the database files are protected if the hardware is lost or stolen.
- **Keep Postgres private.** The default `docker-compose.yml` doesn't publish the database port. Leave it that way.
- **Encrypt your backups** if you back up the Postgres volume.
- **Use a strong `SECRET_KEY`.** Generate one with `openssl rand -hex 32`. Changing it signs everyone out.

### A note on SSO

After the first SSO sign-in, an account is tied to that person's identity at the provider (the issuer and `sub` claim), so later sign-ins don't depend on email at all.

On that first sign-in, the app looks for an existing account with the same email address:

- **Email verified by the provider:** the SSO identity is linked to that account.
- **Email not verified:** sign-in is refused, so nobody can claim someone else's account with an unverified address. Verify the email at the provider, or turn on its `email_verified` claim.
- **More than one account uses the email:** sign-in is refused until the duplicate is fixed.
- **No match:** a new account is created. The email is saved only if the provider verified it.

---

## License

[MIT](LICENSE). Copyright 2026 Steven Dogiakos.

---

## Acknowledgments

- [Snipe-IT](https://snipeitapp.com/), for the asset management model this is based on
- The open-source community that makes self-hosting practical
