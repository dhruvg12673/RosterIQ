"""
Database Reset Utility for Development
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.database import Base, engine
from app.seed_data import seed


def reset():
    print("⚠️  Dropping all database tables...")
    Base.metadata.drop_all(bind=engine)
    print("🏗️  Recreating all database tables...")
    Base.metadata.create_all(bind=engine)
    print("🌱 Re-seeding database...")
    return seed()


if __name__ == "__main__":
    confirm = input("Are you sure you want to completely RESET the database? (y/N): ")
    if confirm.lower() == "y":
        reset()
    else:
        print("Reset cancelled.")
