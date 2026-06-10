from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    logger.info(f"Connecting to database using DATABASE_URL (first 50 chars): {DATABASE_URL[:50]}...")
    # Для Supabase нужно использовать SSL
    engine = create_engine(DATABASE_URL, connect_args={"sslmode": "require"})
else:
    logger.warning("DATABASE_URL not set, using SQLite (data will be lost on restart)")
    engine = create_engine("sqlite:///./habits.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
