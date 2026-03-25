# 🗃️ Medicine Cabinet

**Medicine Cabinet** is a self-hosted web app for tracking your household's medications, prescriptions, and first-aid supplies — running entirely on your own server.

Inspired by tools like [Snipe-IT](https://snipeitapp.com/), it treats prescription medications as trackable assets assigned to people, and general supplies as consumables. Built for families, caregivers, or anyone managing health items at home.

---

## ✨ Current Features

- **Full medication management** — create, view, edit, and delete medications with name, dosage, form, category, and notes
- **Prescription tracking** — link prescriptions to people and medications; track fill dates, refills remaining, expiration dates, and status
- **Consumable inventory** — track first-aid supplies and OTC items with quantities and reorder thresholds
- **People profiles** — store allergy information, medical conditions, and emergency contacts per household member
- **REST API** — all data accessible via a documented FastAPI backend (`/docs` for interactive Swagger UI)

---

## 🧪 Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Frontend     | React 18 + React Router + Tailwind CSS  |
| Build        | Vite 4                                  |
| HTTP         | Axios                                   |
| Backend      | FastAPI (Python 3.11)                   |
| ORM          | SQLAlchemy                              |
| Migrations   | Alembic                                 |
| Database     | PostgreSQL 15                           |
| Self-hosting | Docker + Docker Compose                 |

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Clone the repository

```bash
git clone https://github.com/snachodog/medicine-cabinet.git
cd medicine-cabinet
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set a secure `POSTGRES_PASSWORD`. The other values have sensible defaults.

### 3. Build and start

```bash
docker-compose up --build
```

### 4. Run database migrations

On first start (or after any schema change), apply Alembic migrations:

```bash
docker-compose exec backend alembic upgrade head
```

### 5. Open the app

- **Frontend:** <http://localhost:5173>
- **API docs:** <http://localhost:8085/docs>

---

## 📁 Project Structure

```
medicine-cabinet/
├── backend/
│   ├── alembic/                  # Database migrations
│   │   └── versions/
│   │       └── 0001_initial_schema.py
│   ├── routers/                  # FastAPI route handlers
│   │   ├── consumables.py
│   │   ├── medications.py
│   │   ├── prescriptions.py
│   │   └── users.py
│   ├── alembic.ini
│   ├── crud.py                   # Database operations
│   ├── database.py               # SQLAlchemy engine + session
│   ├── main.py                   # App entry point, CORS, router registration
│   ├── models.py                 # SQLAlchemy ORM models
│   ├── requirements.txt
│   ├── schemas.py                # Pydantic request/response schemas
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Consumables.jsx
│   │   │   ├── Medications.jsx
│   │   │   ├── Prescriptions.jsx
│   │   │   └── Users.jsx
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── .env.example                  # Copy to .env and fill in values
├── docker-compose.yml
└── README.md
```

---

## 🗺️ Roadmap

### Phase 2 — Core UX

- [ ] Edit and delete UI controls on all list views
- [ ] Expiration date highlighting (yellow = expiring soon, red = expired)
- [ ] Display medication name and person name in prescription list
- [ ] Search and filter on medication and consumable lists
- [ ] Client-side form validation with inline error messages
- [ ] Mobile-responsive layout

### Phase 3 — Authentication

- [ ] Separate login accounts from tracked people (one account, multiple profiles)
- [ ] JWT-based login/logout
- [ ] Route-level authentication guards

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
