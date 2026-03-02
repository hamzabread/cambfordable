#!/usr/bin/env python3
"""
Direct database schema update script
This adds image_url columns to homeworks and quiz_questions tables
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, inspect

# Load environment
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in environment")
    sys.exit(1)

print("🔍 Connecting to database...")
engine = create_engine(DATABASE_URL)

try:
    with engine.begin() as conn:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"✓ Connected. Found tables: {', '.join(tables)}")
        
        # Add image_url to homeworks
        if 'homeworks' in tables:
            columns = [col['name'] for col in inspector.get_columns('homeworks')]
            if 'image_url' not in columns:
                print("\n📝 Adding image_url to homeworks...")
                conn.execute(text("ALTER TABLE homeworks ADD COLUMN image_url VARCHAR NULL"))
                print("   ✓ Column added")
            else:
                print("\n➡️  image_url already exists in homeworks")
        else:
            print("⚠️  homeworks table not found")
        
        # Add image_url to quiz_questions
        if 'quiz_questions' in tables:
            columns = [col['name'] for col in inspector.get_columns('quiz_questions')]
            if 'image_url' not in columns:
                print("\n📝 Adding image_url to quiz_questions...")
                conn.execute(text("ALTER TABLE quiz_questions ADD COLUMN image_url VARCHAR NULL"))
                print("   ✓ Column added")
            else:
                print("\n➡️  image_url already exists in quiz_questions")
        else:
            print("⚠️  quiz_questions table not found")
        
        print("\n✅ Database schema updated successfully!")

except Exception as e:
    print(f"\n❌ Error: {e}")
    sys.exit(1)
