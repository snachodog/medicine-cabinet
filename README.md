# 🗃️ Medicine Cabinet

**Medicine Cabinet** is a self-hosted web app that helps you track your household's medicines, prescriptions, and first-aid supplies—right from your own server.

Inspired by tools like Snipe-IT, this app treats prescription meds as trackable "assets" and general supplies as "consumables." Perfect for families, caregivers, or anyone managing health items at home.

---

## ✨ Features (MVP)

- ✅ Add and manage medications (prescription or OTC)
- ✅ Track who each medication is for
- ✅ Track expiration dates and refills
- ✅ Add and manage consumables like band-aids, wraps, and more
- ✅ Track inventory quantities for consumables
- ✅ Visual dashboard for expiring meds and low stock items
- ✅ Simple category system for organization

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
git clone https://github.com/yourusername/medicabinet.git
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
-  Add medication usage logging
-  Refill reminders and email alerts
-  Doctor & pharmacy directory
-  Mobile-friendly UI
-  API support for mobile/PWA clients

### 🛡️ Privacy & Security

**Medicine Cabinet** is designed to be self-hosted so you can keep sensitive health-related data private and local. Your information stays on your own machine or server.

## 📜 License

TBD

## 🙏 Acknowledgments

Inspired by:
- [Snipe-IT](https://snipeitapp.com/) for asset/consumable design
- Everyone who maintains open-source tools that make self-hosting easier
