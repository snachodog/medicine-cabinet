# backend/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .routers import auth as auth_router
from .routers import persons, medications, prescriptions, dose_logs, catalog, notifications

_frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# All API routes prefixed with /api — registered before static file serving
app.include_router(auth_router.router, prefix="/api")
app.include_router(persons.router, prefix="/api")
app.include_router(medications.router, prefix="/api")
app.include_router(prescriptions.router, prefix="/api")
app.include_router(dose_logs.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")

# Serve compiled frontend assets (JS/CSS bundles)
_assets_dir = os.path.join(_frontend_dist, "assets")
if os.path.isdir(_assets_dir):
    app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")

# Catch-all: return index.html for any non-API path so React Router handles routing
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    return FileResponse(os.path.join(_frontend_dist, "index.html"))
