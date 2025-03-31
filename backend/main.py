# backend/main.py
# --------------
# FastAPI entry point

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