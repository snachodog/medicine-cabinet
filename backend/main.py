# backend/main.py
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from .routers import auth as auth_router
from .routers import persons, medications, prescriptions, dose_logs, catalog, notifications, audit, contacts, calendar, oidc as oidc_router
from .limiter import limiter
from .scheduler import start_scheduler, stop_scheduler

_frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(lifespan=lifespan)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response


app.add_middleware(SecurityHeadersMiddleware)

# All API routes prefixed with /api — registered before static file serving
app.include_router(auth_router.router, prefix="/api")
app.include_router(persons.router, prefix="/api")
app.include_router(medications.router, prefix="/api")
app.include_router(prescriptions.router, prefix="/api")
app.include_router(dose_logs.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(contacts.router, prefix="/api")
app.include_router(calendar.router, prefix="/api")
app.include_router(oidc_router.router, prefix="/api")

# Serve compiled frontend assets (JS/CSS bundles)
_assets_dir = os.path.join(_frontend_dist, "assets")
if os.path.isdir(_assets_dir):
    app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")

# Catch-all: return index.html for any non-API path so React Router handles routing
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    return FileResponse(os.path.join(_frontend_dist, "index.html"))
