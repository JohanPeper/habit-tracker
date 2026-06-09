from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import models, schemas
from datetime import date, timedelta

router = APIRouter(prefix="/habits", tags=["habits"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Создать привычку
@router.post("/", response_model=schemas.Habit)
def create_habit(habit: schemas.HabitCreate, user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_habit = models.Habit(title=habit.title, description=habit.description, user_id=user_id)
    db.add(new_habit)
    db.commit()
    db.refresh(new_habit)
    return new_habit

# Получить все привычки пользователя (с их завершениями)
@router.get("/", response_model=list[schemas.Habit])
def get_habits(user_id: int, db: Session = Depends(get_db)):
    habits = db.query(models.Habit).filter(models.Habit.user_id == user_id).all()
    # Принудительно загружаем completions для каждого
    for h in habits:
        db.refresh(h)
    return habits

# Отметить выполнение за конкретную дату (по умолчанию сегодня)
@router.post("/{habit_id}/complete")
def complete_habit(habit_id: int, completion_date: date = None, db: Session = Depends(get_db)):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
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

# Снять отметку за дату
@router.delete("/{habit_id}/complete")
def uncomplete_habit(habit_id: int, completion_date: date = None, db: Session = Depends(get_db)):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
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

# Получить количество дней подряд (streak)
@router.get("/{habit_id}/streak")
def get_streak(habit_id: int, db: Session = Depends(get_db)):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
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

# Удалить привычку полностью
@router.delete("/{habit_id}")
def delete_habit(habit_id: int, db: Session = Depends(get_db)):
    habit = db.query(models.Habit).filter(models.Habit.id == habit_id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(habit)
    db.commit()
    return {"ok": True}