# 🗃️ Medicine Cabinet

**Medicine Cabinet** is a self-hosted web app for tracking your household's medications, prescriptions, and first-aid supplies — running entirely on your own server.

Inspired by tools like [Snipe-IT](https://snipeitapp.com/), it treats prescription medications as trackable assets assigned to people, and general supplies as consumables. Built for families, caregivers, or anyone managing health items at home.

---

## ✨ Current Features

- **Full medication management** — create, view, edit, and delete medications with name, dosage, form, category, and notes
- **Prescription tracking** — link prescriptions to people and medications; track fill dates, refills remaining, expiration dates, and status
- **Consumable inventory** — track first-aid supplies and OTC items with quantities and reorder thresholds
- **People profiles** — store allergy information, medical conditions, and emergency contacts per household member
- **Authentication** — JWT-based login with user accounts; all data protected behind authentication
- **REST API** — all data accessible via a documented FastAPI backend (`/api/docs` for interactive Swagger UI)

---

## 🧪 Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Frontend     | React 18 + React Router + Tailwind CSS  |
| Backend      | FastAPI (Python 3.11)                   |
| ORM          | SQLAlchemy                              |
| Migrations   | Alembic (runs automatically on startup) |
| Database     | PostgreSQL 15                           |
| Self-hosting | Docker + Docker Compose                 |
| Image        | `dogiakos/medicine-cabinet:latest`      |

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Download the compose file

```bash
curl -O https://raw.githubusercontent.com/snachodog/medicine-cabinet/main/docker-compose.yml
```

Or clone the repo if you prefer:

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

The app container pulls from `dogiakos/medicine-cabinet:latest`. Database migrations run automatically on startup — no manual steps required.

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

## 🗺️ Roadmap

### Phase 2 — Core UX ✅

- [x] Edit and delete UI controls on all list views
- [x] Expiration date highlighting (yellow = expiring soon, red = expired)
- [x] Display medication name and person name in prescription list
- [x] Search and filter on medication and consumable lists
- [x] Client-side form validation with inline error messages
- [x] Mobile-responsive layout

### Phase 3 — Authentication ✅

- [x] Separate login accounts from tracked people (one account, multiple profiles)
- [x] JWT-based login/logout
- [x] Route-level authentication guards

### Phase 4 — Notifications & Dashboard

- [ ] Dashboard: expiring prescriptions, low-stock consumables, recent activity
- [ ] Email/notification reminders for refills and approaching expiration dates

### Phase 5 — Advanced Features

- [ ] Barcode scanning to pre-fill medication fields
- [ ] CSV import/export for bulk management
- [ ] Audit log of all create/update/delete events
- [ ] Doctor & pharmacy directory
- [ ] Mobile PWA / API support for mobile clients

---

## 🛡️ Privacy & Security

Medicine Cabinet is designed to be **self-hosted** so sensitive health data stays on your own machine or server and never passes through a third-party service. You control the database, the backups, and the access.

---

## 📜 License

[MIT](LICENSE) — © 2025 Steven Dogiakos

---

## 🙏 Acknowledgments

- [Snipe-IT](https://snipeitapp.com/) for the asset/consumable management model
- The open-source community that makes self-hosting practical
