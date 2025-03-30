# 🗃️ Medicine Cabinet

**Medicine Cabinet** is a self-hosted web app that helps you track your household's medicines, prescriptions, and first-aid supplies—right from your own server.

Inspired by tools like Snipe-IT, this app treats prescription meds as trackable "assets" and general supplies as "consumables." Perfect for families, caregivers, or anyone managing health items at home.

---

## ✨ Current Features
- Medication Management:
Add, view, update, and delete medications (both prescription and OTC).

- Consumable Tracking:
Manage basic consumable items like first-aid supplies and band-aids.

- Basic Detail Recording:
Record key information such as medication names, dosages, and expiration dates.

- Simple Categorization:
Organize items using a basic category system for easier navigation.

---

## 🧪 Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** SQLite (PostgreSQL-ready)
- **Self-Hosting:** Docker / Docker Compose

---

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose installed on your server or development machine

### Clone the Repo

```bash
git clone https://github.com/snachodog/medicabinet.git
cd medicabinet
```

### Build & Run
`docker-compose up --build`

Then visit: <http://localhost:3000>

### 📁 Project Structure

```
medicabinet/
├── backend/              # FastAPI app
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── ...
├── frontend/             # React frontend
│   ├── public/
│   ├── src/
│   └── ...
├── docker-compose.yml
└── README.md
```
### Road Map
- [ ] Add authentication and role-based access
- [ ] Add medication usage logging
- [ ] Refill reminders and email alerts/notifications
- [ ] Doctor & pharmacy directory
- [ ] Enhanced Visual Dashboard with detailed view and analytics for expiring medications and low stock
- [ ] Doctor & pharmacy directory
- [ ] Mobile-friendly UI
- [ ] API support for mobile/PWA clients
- [ ] Track medication allergies

### 🛡️ Privacy & Security

**Medicine Cabinet** is designed to be self-hosted so you can keep sensitive health-related data private and local. Your information stays on your own machine or server.

## 📜 License

TBD

## 🙏 Acknowledgments

Inspired by:
- [Snipe-IT](https://snipeitapp.com/) for asset/consumable design
- Everyone who maintains open-source tools that make self-hosting easier
