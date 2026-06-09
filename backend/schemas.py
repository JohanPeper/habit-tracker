from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

# ----- Пользователи -----
class UserBase(BaseModel):
    name: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    class Config:
        from_attributes = True   # замена orm_mode

# ----- Завершения привычек (дни) -----
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
    completions: List[HabitCompletion] = []   # теперь список завершений
    class Config:
        from_attributes = True