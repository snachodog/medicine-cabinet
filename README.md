# Medicine Cabinet

**Medicine Cabinet** is a self-hosted web app for tracking your household's medications, prescriptions, and dose history — running entirely on your own server.

Inspired by tools like [Snipe-IT](https://snipeitapp.com/), it treats medications as trackable assets assigned to people. Built for families, caregivers, or anyone managing health items at home.

---

## Current Features

### Household & Profiles

- **Multi-person households** — manage medications for multiple people under one account
- **Household sharing** — grant other accounts access to a person's records by username; revoke at any time
- **Person profiles** — store allergies and notes per household member
- **Allergy tracking** — allergy information is prominently displayed and exported to PDF

### Medications & Prescriptions

- **Medication management** — create, edit, and delete medications with name, dosage, form, type (OTC/supplement/Rx/Schedule II), schedule, and notes
- **Prescription tracking** — link prescriptions to people; track fill dates, scripts remaining, next eligible date, prescriber, pharmacy, and co-pay
- **Dose logging** — record when doses are taken; view history per medication
- **Medication catalog** — search a built-in drug reference to pre-fill medication fields by name or barcode (UPC)

### Contacts

- **Provider directory** — save prescribers with specialty, phone, and address; autofills prescription forms
- **Pharmacy directory** — save pharmacies with contact info; autofills prescription forms

### Exports & Integrations

- **PDF medication report** — generate a printable report per person listing all active medications, suitable for handing to a provider or emergency services
- **Calendar feed (ICS)** — subscribe to a per-account `.ics` feed in any calendar app (Google Calendar, Apple Calendar, Outlook) with pickup events and refill reminders; or download a one-time snapshot

### Notifications & Reminders

- **Refill reminders** — configurable advance notice (days) before a prescription's next eligible pickup date
- **Expiration highlighting** — prescriptions approaching or past expiration are flagged in the UI

### Security & Administration

- **httpOnly cookie auth** — JWT stored in a secure httpOnly SameSite=Lax cookie; never exposed to JavaScript
- **Token revocation** — logout invalidates the session token immediately
- **Password policy** — minimum 8 characters with uppercase, lowercase, digit, and special character required at registration
- **Rate limiting** — login and registration endpoints are rate-limited to prevent brute force
- **Audit log** — all create/update/delete events are logged and visible to household members
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` applied on every response

### Developer / API

- **REST API** — all data accessible via the FastAPI backend; interactive docs at `/api/docs`
- **Alembic migrations** — schema migrations run automatically on startup; no manual steps

---

## Tech Stack

| Layer        | Technology                             |
|--------------|----------------------------------------|
| Frontend     | React 18 + React Router + Tailwind CSS |
| Backend      | FastAPI (Python 3.11)                  |
| ORM          | SQLAlchemy                             |
| Migrations   | Alembic (auto-runs on startup)         |
| Database     | PostgreSQL 15                          |
| Self-hosting | Docker + Docker Compose                |
| Image        | `dogiakos/medicine-cabinet:latest`     |

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Download the compose file

```bash
curl -O https://raw.githubusercontent.com/snachodog/medicine-cabinet/main/docker-compose.yml
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

Edit `.env` with secure values. Generate strong secrets with:

```bash
openssl rand -hex 24   # for POSTGRES_PASSWORD
openssl rand -hex 32   # for SECRET_KEY
```

Your `.env` should look like:

```env
POSTGRES_PASSWORD=your-strong-password
POSTGRES_USER=medicabinet
POSTGRES_DB=medicabinet_db
SECRET_KEY=your-long-random-secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 3. Start

```bash
docker compose up -d
```

The app container pulls from `dogiakos/medicine-cabinet:latest`. Database migrations run automatically on startup.

### 4. Open the app

- **App:** <http://localhost:8000>
- **API docs:** <http://localhost:8000/api/docs>

Register an account on first visit.

### Updating

```bash
docker compose pull
docker compose up -d
```

---

## Roadmap

### In progress / next up

- [ ] **Email notifications** — refill reminders and expiration alerts delivered by email (#13)
- [ ] **Expanded scheduling options** — support for every-N-days, weekly, and PRN dose schedules beyond morning/evening/as-needed (#21)
- [ ] **Remove Schedule II from medication type list** — reconsider type taxonomy (#28)

### Future ideas

- [ ] CSV import/export for bulk medication management
- [ ] Dashboard view — expiring prescriptions, upcoming refills, recent activity at a glance
- [ ] Mobile PWA — offline-capable client for logging doses on the go
- [ ] Barcode scanning — camera-based UPC lookup to pre-fill medication fields in the UI

---

## Privacy & Security

Medicine Cabinet is designed to be **self-hosted** so sensitive health data stays on your own machine or server and never passes through a third-party service. You control the database, the backups, and the access.

Tokens are stored in httpOnly cookies and never accessible to JavaScript. All data is scoped to authenticated accounts, and household sharing requires an explicit grant by an existing member.

---

## License

[MIT](LICENSE) — © 2025 Steven Dogiakos

---

## Acknowledgments

- [Snipe-IT](https://snipeitapp.com/) for the asset/consumable management model
- The open-source community that makes self-hosting practical
