import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [userName, setUserName] = useState('');
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState({ title: '', description: '' });
  const [selectedHabitForCalendar, setSelectedHabitForCalendar] = useState(null);
  const [completionDates, setCompletionDates] = useState({});
  const [editingHabitId, setEditingHabitId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    axios.get(`${API}/users/`).then(res => setUsers(res.data));
  }, []);

  const loginOrRegister = async () => {
    if (!userName.trim()) return;
    try {
      const existing = users.find(u => u.name === userName);
      if (existing) {
        setUser(existing);
      } else {
        const res = await axios.post(`${API}/users/`, { name: userName });
        setUser(res.data);
        setUsers([...users, res.data]);
      }
    } catch (err) {
      alert('Ошибка: ' + err.response?.data?.detail || err.message);
    }
  };

  useEffect(() => {
    if (user) {
      axios.get(`${API}/habits/`, { params: { user_id: user.id } })
        .then(res => {
          setHabits(res.data);
          const datesMap = {};
          res.data.forEach(habit => {
            if (habit.completions) {
              datesMap[habit.id] = new Set(habit.completions.map(c => c.completion_date));
            } else {
              datesMap[habit.id] = new Set();
            }
          });
          setCompletionDates(datesMap);
        });
    }
  }, [user]);

  const addHabit = async () => {
    if (!newHabit.title.trim()) return;
    try {
      const res = await axios.post(`${API}/habits/`, newHabit, {
        params: { user_id: user.id }
      });
      setHabits([...habits, res.data]);
      setCompletionDates({ ...completionDates, [res.data.id]: new Set() });
      setNewHabit({ title: '', description: '' });
    } catch (err) {
      alert('Ошибка: ' + err.response?.data?.detail || err.message);
    }
  };

  const toggleCompletion = async (habitId, dateStr) => {
    try {
      const isCompleted = completionDates[habitId]?.has(dateStr);
      if (isCompleted) {
        await axios.delete(`${API}/habits/${habitId}/complete`, { params: { completion_date: dateStr } });
      } else {
        await axios.post(`${API}/habits/${habitId}/complete`, null, { params: { completion_date: dateStr } });
      }
      const newSet = new Set(completionDates[habitId]);
      if (isCompleted) newSet.delete(dateStr);
      else newSet.add(dateStr);
      setCompletionDates({ ...completionDates, [habitId]: newSet });
    } catch (err) {
      alert('Ошибка: ' + err.response?.data?.detail || err.message);
    }
  };

  const deleteHabit = async (habitId) => {
    if (!window.confirm('Удалить привычку?')) return;
    try {
      await axios.delete(`${API}/habits/${habitId}`);
      setHabits(habits.filter(h => h.id !== habitId));
      const newDates = { ...completionDates };
      delete newDates[habitId];
      setCompletionDates(newDates);
    } catch (err) {
      alert('Ошибка: ' + err.response?.data?.detail || err.message);
    }
  };

  const updateHabitDetails = async (habitId) => {
    try {
      const updates = {};
      if (editTitle !== undefined) updates.title = editTitle;
      if (editDesc !== undefined) updates.description = editDesc;
      const res = await axios.put(`${API}/habits/${habitId}`, updates);
      setHabits(habits.map(h => h.id === habitId ? res.data : h));
      setEditingHabitId(null);
    } catch (err) {
      alert('Ошибка обновления: ' + err.response?.data?.detail || err.message);
    }
  };

  const startEdit = (habit) => {
    setEditingHabitId(habit.id);
    setEditTitle(habit.title);
    setEditDesc(habit.description || '');
  };

  const cancelEdit = () => {
    setEditingHabitId(null);
  };

  const calculateStreak = (habitId) => {
    const dates = Array.from(completionDates[habitId] || [])
      .map(d => new Date(d))
      .sort((a,b) => b - a);
    if (dates.length === 0) return 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    let streak = 0;
    let checkDate = today;
    while (true) {
      const dateStr = checkDate.toISOString().slice(0,10);
      if (completionDates[habitId]?.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const markToday = async (habitId) => {
    const todayStr = new Date().toISOString().slice(0,10);
    await toggleCompletion(habitId, todayStr);
  };

  // --- Расчёт процента выполнения за текущий месяц ---
  const getMonthProgress = (habitId) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let completedCount = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(year, month, day).toISOString().slice(0,10);
      if (completionDates[habitId]?.has(dateStr)) {
        completedCount++;
      }
    }
    const percent = daysInMonth === 0 ? 0 : (completedCount / daysInMonth) * 100;
    return { completedCount, totalDays: daysInMonth, percent: Math.round(percent) };
  };

  const Calendar = ({ habitId, onClose }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysArray = [];
    for (let i = 0; i < startDay; i++) daysArray.push(null);
    for (let d = 1; d <= daysInMonth; d++) daysArray.push(new Date(year, month, d));

    const prevMonth = () => setCurrentMonth(new Date(year, month-1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month+1, 1));
    const todayStr = new Date().toISOString().slice(0,10);

    return (
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: 20, borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 1000, width: 320 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={prevMonth}>&lt;</button>
          <strong>{currentMonth.toLocaleString('ru', { month: 'long', year: 'numeric' })}</strong>
          <button onClick={nextMonth}>&gt;</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, textAlign: 'center' }}>
          {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(day => <div key={day} style={{ fontWeight: 'bold' }}>{day}</div>)}
          {daysArray.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`}></div>;
            const dateStr = date.toISOString().slice(0,10);
            const isCompleted = completionDates[habitId]?.has(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <div
                key={idx}
                onClick={() => toggleCompletion(habitId, dateStr)}
                style={{
                  padding: '8px 4px',
                  background: isCompleted ? '#4caf50' : '#f0f0f0',
                  borderRadius: 30,
                  cursor: 'pointer',
                  fontWeight: isToday ? 'bold' : 'normal',
                  border: isToday ? '2px solid #764ba2' : 'none'
                }}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
        <button onClick={onClose} style={{ marginTop: 16, width: '100%', background: '#333' }}>Закрыть</button>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="container" style={{ maxWidth: 500, textAlign: 'center' }}>
        <h1>✨ Habit Tracker</h1>
        <p style={{ color: '#475569', marginBottom: 24 }}>Войдите или создайте профиль</p>
        <input
          value={userName}
          onChange={e => setUserName(e.target.value)}
          placeholder="Ваше имя"
          onKeyPress={e => e.key === 'Enter' && loginOrRegister()}
          style={{ marginBottom: 16 }}
        />
        <button onClick={loginOrRegister}>Продолжить</button>
        {users.length > 0 && (
          <div style={{ marginTop: 32, textAlign: 'left' }}>
            <h3>👥 Участники</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {users.map(u => <li key={u.id} style={{ padding: '4px 0' }}>• {u.name}</li>)}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>📋 Привычки</h1>
          <p style={{ color: '#475569' }}>Пользователь: <strong>{user.name}</strong></p>
        </div>
        <button onClick={() => setUser(null)} style={{ background: '#e2e8f0', color: '#1e293b' }}>Сменить</button>
      </div>

      <div style={{ background: '#f8fafc', borderRadius: 24, padding: 20, marginBottom: 28 }}>
        <h3 style={{ marginTop: 0 }}>➕ Новая привычка</h3>
        <div className="form-group">
          <input
            value={newHabit.title}
            onChange={e => setNewHabit({ ...newHabit, title: e.target.value })}
            onKeyPress={e => e.key === 'Enter' && addHabit()}
            placeholder="Название (например, «Зарядка»)"
          />
        </div>
        <div className="form-group">
          <input
            value={newHabit.description}
            onChange={e => setNewHabit({ ...newHabit, description: e.target.value })}
            onKeyPress={e => e.key === 'Enter' && addHabit()}
            placeholder="Описание (необязательно)"
          />
        </div>
        <button onClick={addHabit} style={{ width: '100%' }}>➕ Добавить привычку</button>
      </div>

      <div>
        <h2>📌 Мои привычки</h2>
        {habits.length === 0 && (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Пока нет привычек. Добавьте первую!</p>
        )}
        {habits.map(habit => {
          const streak = calculateStreak(habit.id);
          const isEditing = editingHabitId === habit.id;
          return (
            <div key={habit.id} className="habit-card">
              <div className="habit-content" style={{ flex: 1 }}>
                {isEditing ? (
                  <div>
                    <input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder="Название"
                      style={{ width: '100%', marginBottom: 8 }}
                    />
                    <input
                      value={editDesc}
                      onChange={e => setEditDesc(e.target.value)}
                      placeholder="Описание"
                      style={{ width: '100%', marginBottom: 8 }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateHabitDetails(habit.id)} style={{ background: '#4caf50', padding: '4px 12px' }}>💾 Сохранить</button>
                      <button onClick={cancelEdit} style={{ background: '#9e9e9e', padding: '4px 12px' }}>❌ Отмена</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="habit-title">{habit.title}</div>
                    {habit.description && <div className="habit-description">{habit.description}</div>}
                    <div style={{ fontSize: '0.8rem', color: '#4caf50', marginTop: 6 }}>🔥 Дней подряд: {streak}</div>
                  </>
                )}
              </div>
              {!isEditing && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => startEdit(habit)} style={{ background: '#ff9800', padding: '6px 12px' }}>✏️</button>
                  <button onClick={() => markToday(habit.id)} style={{ background: '#4caf50', padding: '6px 12px' }}>✅ Сегодня</button>
                  <button onClick={() => setSelectedHabitForCalendar(habit.id)} style={{ background: '#2196f3' }}>📅</button>
                  <button onClick={() => deleteHabit(habit.id)} className="delete-btn">🗑</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Блок статистики за текущий месяц */}
      {habits.length > 0 && (
        <div style={{ marginTop: 40, padding: '20px', background: '#f1f5f9', borderRadius: 24 }}>
          <h2>📊 Статистика за этот месяц</h2>
          {habits.map(habit => {
            const { completedCount, totalDays, percent } = getMonthProgress(habit.id);
            return (
              <div key={habit.id} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong>{habit.title}</strong>
                  <span>{completedCount} / {totalDays} ({percent}%)</span>
                </div>
                <div style={{ background: '#e2e8f0', borderRadius: 20, overflow: 'hidden' }}>
                  <div style={{
                    width: `${percent}%`,
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    height: '12px',
                    borderRadius: 20,
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedHabitForCalendar && (
        <Calendar habitId={selectedHabitForCalendar} onClose={() => setSelectedHabitForCalendar(null)} />
      )}
    </div>
  );
}

export default App;