from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from auth import get_current_user
import models, schemas
from datetime import date, timedelta

router = APIRouter(prefix="/habits", tags=["habits"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Создать привычку (user берётся из токена)
@router.post("/", response_model=schemas.Habit)
def create_habit(habit: schemas.HabitCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_habit = models.Habit(title=habit.title, description=habit.description, user_id=current_user.id)
    db.add(new_habit)
    db.commit()
    db.refresh(new_habit)
    return new_habit

# Получить все привычки текущего пользователя
@router.get("/", response_model=list[schemas.Habit])
def get_habits(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    habits = db.query(models.Habit).filter(models.Habit.user_id == current_user.id).all()
    for h in habits:
        db.refresh(h)
    return habits

# Отметить выполнение
@router.post("/{habit_id}/complete")
def complete_habit(habit_id: int, completion_date: date = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id, models.Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    if completion_date is None:
        completion_date = date.today()
    existing = db.query(models.HabitCompletion).filter(
        models.HabitCompletion.habit_id == habit_id,
        models.HabitCompletion.completion_date == completion_date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already completed for this date")
    new_completion = models.HabitCompletion(habit_id=habit_id, completion_date=completion_date)
    db.add(new_completion)
    db.commit()
    return {"message": "Completed"}

# Снять отметку
@router.delete("/{habit_id}/complete")
def uncomplete_habit(habit_id: int, completion_date: date = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id, models.Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    if completion_date is None:
        completion_date = date.today()
    completion = db.query(models.HabitCompletion).filter(
        models.HabitCompletion.habit_id == habit_id,
        models.HabitCompletion.completion_date == completion_date
    ).first()
    if not completion:
        raise HTTPException(status_code=404, detail="No completion for this date")
    db.delete(completion)
    db.commit()
    return {"message": "Uncompleted"}

# Streak
@router.get("/{habit_id}/streak")
def get_streak(habit_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id, models.Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    completions = db.query(models.HabitCompletion).filter(
        models.HabitCompletion.habit_id == habit_id
    ).order_by(models.HabitCompletion.completion_date.desc()).all()
    if not completions:
        return {"streak": 0}
    streak = 0
    check_date = date.today()
    while True:
        if any(c.completion_date == check_date for c in completions):
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break
    return {"streak": streak}

# Обновить привычку
@router.put("/{habit_id}", response_model=schemas.Habit)
def update_habit(habit_id: int, habit_update: schemas.HabitUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id, models.Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    if habit_update.title is not None:
        habit.title = habit_update.title
    if habit_update.description is not None:
        habit.description = habit_update.description
    db.commit()
    db.refresh(habit)
    return habit

# Удалить привычку
@router.delete("/{habit_id}")
def delete_habit(habit_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id, models.Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(habit)
    db.commit()
    return {"ok": True}