#!/usr/bin/env python3
"""
Direct database schema update script.

Adds:
  - enrollments.payment_proof_data  (proof bytes, survives Railway's ephemeral FS)
  - enrollments.payment_proof_mime
  - enrollments.payment_uploaded_at
  - users.is_teacher                (new Teacher role)

Safe to run multiple times — it only adds columns that are missing.
Run once against production after deploying:  python add_payment_columns.py
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, inspect

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in environment")
    sys.exit(1)

# (table, column, "SQL type" )  — uses portable types that work on Postgres & SQLite
COLUMNS = [
    ("enrollments", "payment_proof_data", "BYTEA"),
    ("enrollments", "payment_proof_mime", "VARCHAR"),
    ("enrollments", "payment_uploaded_at", "TIMESTAMP"),
    ("users", "is_teacher", "BOOLEAN DEFAULT FALSE NOT NULL"),
]

print("🔍 Connecting to database...")
engine = create_engine(DATABASE_URL)
is_sqlite = engine.dialect.name == "sqlite"

try:
    with engine.begin() as conn:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"✓ Connected. Found tables: {', '.join(tables)}")

        for table, column, sql_type in COLUMNS:
            if table not in tables:
                print(f"⚠️  {table} table not found — skipping {column}")
                continue

            existing = [c["name"] for c in inspector.get_columns(table)]
            if column in existing:
                print(f"➡️  {table}.{column} already exists")
                continue

            # SQLite stores bytes as BLOB and has no BYTEA / NOT NULL-with-default on ALTER
            col_type = sql_type
            if is_sqlite:
                col_type = col_type.replace("BYTEA", "BLOB")
                # SQLite needs a literal default and can't add NOT NULL without one
                col_type = col_type.replace("BOOLEAN DEFAULT FALSE NOT NULL", "BOOLEAN DEFAULT 0")

            print(f"📝 Adding {table}.{column} ({col_type})...")
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
            print("   ✓ Column added")

        print("\n✅ Database schema updated successfully!")

except Exception as e:
    print(f"\n❌ Error: {e}")
    sys.exit(1)
