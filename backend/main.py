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
from fastapi.responses import FileResponse
from .routers import persons, medications, prescriptions, consumables
from .routers import auth as auth_router

_frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# All API routes are prefixed with /api — registered before static file serving
app.include_router(auth_router.router, prefix="/api")
app.include_router(persons.router, prefix="/api")
app.include_router(medications.router, prefix="/api")
app.include_router(prescriptions.router, prefix="/api")
app.include_router(consumables.router, prefix="/api")

# Serve compiled frontend assets (JS/CSS bundles)
_assets_dir = os.path.join(_frontend_dist, "assets")
if os.path.isdir(_assets_dir):
    app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")

# Catch-all: return index.html for any non-API path so React Router handles routing
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    return FileResponse(os.path.join(_frontend_dist, "index.html"))
