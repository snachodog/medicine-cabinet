# backend/main.py
# --------------
# FastAPI entry point
# TODO: Add email notification support for refill reminders and expiration alerts.
# Use a background task or APScheduler to send warnings 7 and 30 days before
# prescription expiration_date. Consider fastapi-mail for SMTP integration.
# TODO: Add CSV import/export endpoints (e.g. GET /export/medications, POST /import/medications)
# so users can bulk-manage their inventory without a UI.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import persons, medications, prescriptions, consumables
from .routers import auth as auth_router


app = FastAPI()

# CORS settings for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://medicabinet-frontend:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(persons.router)
app.include_router(medications.router)
app.include_router(prescriptions.router)
app.include_router(consumables.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Medicine Cabinet API"}
