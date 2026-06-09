from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    name: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int

    class Config:
        orm_mode = True

class HabitBase(BaseModel):
    title: str
    description: Optional[str] = ""

class HabitCreate(HabitBase):
    pass

class HabitUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None

class Habit(HabitBase):
    id: int
    completed: bool
    user_id: int

    class Config:
        orm_mode = True