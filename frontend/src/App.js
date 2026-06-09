import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [userName, setUserName] = useState('');
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState({ title: '', description: '' });

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
        .then(res => setHabits(res.data));
    }
  }, [user]);

  const addHabit = async () => {
    if (!newHabit.title.trim()) return;
    try {
      const res = await axios.post(`${API}/habits/`, newHabit, {
        params: { user_id: user.id }
      });
      setHabits([...habits, res.data]);
      setNewHabit({ title: '', description: '' });
    } catch (err) {
      alert('Ошибка: ' + err.response?.data?.detail || err.message);
    }
  };

  const updateHabit = async (id, updates) => {
    try {
      const res = await axios.put(`${API}/habits/${id}`, updates);
      setHabits(habits.map(h => h.id === id ? res.data : h));
    } catch (err) {
      alert('Ошибка: ' + err.response?.data?.detail || err.message);
    }
  };

  const deleteHabit = async (id) => {
    if (!window.confirm('Удалить привычку?')) return;
    try {
      await axios.delete(`${API}/habits/${id}`);
      setHabits(habits.filter(h => h.id !== id));
    } catch (err) {
      alert('Ошибка: ' + err.response?.data?.detail || err.message);
    }
  };

  // Обработка клавиши Enter в полях формы
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addHabit();
    }
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
            onKeyPress={handleKeyPress}
            placeholder="Название (например, «Зарядка»)"
          />
        </div>
        <div className="form-group">
          <input
            value={newHabit.description}
            onChange={e => setNewHabit({ ...newHabit, description: e.target.value })}
            onKeyPress={handleKeyPress}
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
        {habits.map(habit => (
          <div key={habit.id} className={`habit-card ${habit.completed ? 'completed' : ''}`}>
            <input
              type="checkbox"
              checked={habit.completed}
              onChange={e => updateHabit(habit.id, { completed: e.target.checked })}
              className="habit-checkbox"
            />
            <div className="habit-content">
              <div className="habit-title">{habit.title}</div>
              {habit.description && <div className="habit-description">{habit.description}</div>}
            </div>
            <button onClick={() => deleteHabit(habit.id)} className="delete-btn">🗑 Удалить</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;