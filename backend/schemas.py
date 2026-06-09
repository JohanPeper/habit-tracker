from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

# ----- Пользователи -----
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

# ----- Завершения привычек -----
class HabitCompletionBase(BaseModel):
    completion_date: date

class HabitCompletionCreate(HabitCompletionBase):
    pass

class HabitCompletion(HabitCompletionBase):
    id: int
    habit_id: int
    class Config:
        from_attributes = True

# ----- Привычки -----
class HabitBase(BaseModel):
    title: str
    description: Optional[str] = ""

class HabitCreate(HabitBase):
    pass

class HabitUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class Habit(HabitBase):
    id: int
    user_id: int
    completions: List[HabitCompletion] = []
    class Config:
        from_attributes = True