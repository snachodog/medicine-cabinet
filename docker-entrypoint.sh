#!/bin/sh
set -e

echo "Waiting for database to be ready..."
python3 - <<'EOF'
import os, sys, time
import psycopg2

host = os.getenv("POSTGRES_HOST", "db")
user = os.getenv("POSTGRES_USER", "medicabinet")
password = os.getenv("POSTGRES_PASSWORD", "")
dbname = os.getenv("POSTGRES_DB", "medicabinet_db")

for attempt in range(30):
    try:
        conn = psycopg2.connect(host=host, user=user, password=password, dbname=dbname)
        conn.close()
        print("Database is ready.")
        sys.exit(0)
    except psycopg2.OperationalError as e:
        print(f"Attempt {attempt + 1}/30: database not ready ({e}), retrying in 2s...")
        time.sleep(2)

print("Database did not become ready in time. Exiting.")
sys.exit(1)
EOF

echo "Running database migrations..."
cd /app/backend
alembic upgrade head

echo "Starting application..."
cd /app
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
