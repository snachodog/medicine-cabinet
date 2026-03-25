# backend/main.py
# --------------
# FastAPI entry point
# TODO: Add email notification support for refill reminders and expiration alerts.
# Use a background task or APScheduler to send warnings 7 and 30 days before
# prescription expiration_date. Consider fastapi-mail for SMTP integration.
# TODO: Add CSV import/export endpoints (e.g. GET /export/medications, POST /import/medications)
# so users can bulk-manage their inventory without a UI.

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routers import persons, medications, prescriptions, consumables
from .routers import auth as auth_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# All API routes are prefixed with /api
app.include_router(auth_router.router, prefix="/api")
app.include_router(persons.router, prefix="/api")
app.include_router(medications.router, prefix="/api")
app.include_router(prescriptions.router, prefix="/api")
app.include_router(consumables.router, prefix="/api")

# Serve the built React app for all non-API routes
_frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(_frontend_dist):
    app.mount("/", StaticFiles(directory=_frontend_dist, html=True), name="spa")
