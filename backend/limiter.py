# backend/limiter.py
# Shared rate limiter instance — imported by main.py and routers that need it.
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
