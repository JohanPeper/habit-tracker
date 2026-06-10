from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("postgresql://postgres.cyetmgrbakuujdisphla:[UuSF8JKymzDkoWTy]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require")
# Если DATABASE_URL не задан, используем локальный SQLite для разработки
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./habits.db"
    connect_args = {"check_same_thread": False}
else:
    connect_args = {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
