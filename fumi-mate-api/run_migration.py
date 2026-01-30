#!/usr/bin/env python3
"""Run database migration and seed data"""

import os
import sys

# Set up environment
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db

def main():
    app = create_app()
    
    with app.app_context():
        print("Running database migration...")
        
        # Import and run the seed data
        from seed import run_seed
        run_seed()
        
        print("\nMigration and seeding completed successfully!")

if __name__ == "__main__":
    main()

