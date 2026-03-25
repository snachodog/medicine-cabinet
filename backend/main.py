# backend/main.py
# --------------
# FastAPI entry point
# TODO: Implement JWT authentication. Add a /auth/login endpoint that returns a signed
# JWT, and a /auth/me endpoint. Use python-jose and passlib[bcrypt]. Protect all
# existing routers with an OAuth2PasswordBearer dependency.
# TODO: Add email notification support for refill reminders and expiration alerts.
# Use a background task or APScheduler to send warnings 7 and 30 days before
# prescription expiration_date. Consider fastapi-mail for SMTP integration.
# TODO: Add CSV import/export endpoints (e.g. GET /export/medications, POST /import/medications)
# so users can bulk-manage their inventory without a UI.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import users, medications, prescriptions, consumables


app = FastAPI()

# CORS settings for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://medicabinet-frontend:5173"],  # Allow both host and container URLs
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(medications.router)
app.include_router(prescriptions.router)
app.include_router(consumables.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Medicine Cabinet API"}