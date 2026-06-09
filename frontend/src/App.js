import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [userName, setUserName] = useState('');
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState({ title: '', description: '' });

  // Загрузка списка пользователей
  useEffect(() => {
    axios.get(`${API}/users/`).then(res => setUsers(res.data));
  }, []);

  // Регистрация / вход по имени
  const loginOrRegister = async () => {
    if (!userName.trim()) return;
    try {
      // Пытаемся найти пользователя с таким именем
      const existing = users.find(u => u.name === userName);
      if (existing) {
        setUser(existing);
      } else {
        // Создаём нового
        const res = await axios.post(`${API}/users/`, { name: userName });
        setUser(res.data);
        setUsers([...users, res.data]);
      }
    } catch (err) {
      alert('Ошибка: ' + err.response?.data?.detail || err.message);
    }
  };

  // Загрузка привычек текущего пользователя
  useEffect(() => {
    if (user) {
      axios.get(`${API}/habits/`, { params: { user_id: user.id } })
        .then(res => setHabits(res.data));
    }
  }, [user]);

  // Добавление привычки
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

  // Обновление привычки (completed или текст)
  const updateHabit = async (id, updates) => {
    try {
      const res = await axios.put(`${API}/habits/${id}`, updates);
      setHabits(habits.map(h => h.id === id ? res.data : h));
    } catch (err) {
      alert('Ошибка: ' + err.response?.data?.detail || err.message);
    }
  };

  // Удаление привычки
  const deleteHabit = async (id) => {
    if (!window.confirm('Удалить привычку?')) return;
    try {
      await axios.delete(`${API}/habits/${id}`);
      setHabits(habits.filter(h => h.id !== id));
    } catch (err) {
      alert('Ошибка: ' + err.response?.data?.detail || err.message);
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: 400, margin: '50px auto', textAlign: 'center' }}>
        <h2>Вход / Регистрация</h2>
        <input
          value={userName}
          onChange={e => setUserName(e.target.value)}
		  onKeyDown={e => e.key === 'Enter' && loginOrRegister()}
          placeholder="Введите ваше имя"
          style={{ width: '100%', padding: 8, marginBottom: 16 }}
        />
        <button onClick={loginOrRegister} style={{ padding: '8px 16px' }}>Продолжить</button>
        <div style={{ marginTop: 20 }}>
          <h4>Уже зарегистрированы:</h4>
          <ul>
            {users.map(u => <li key={u.id}>{u.name}</li>)}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '30px auto', padding: '0 20px' }}>
      <h1>Привычки пользователя: {user.name}</h1>
      <button onClick={() => setUser(null)} style={{ marginBottom: 20 }}>Сменить пользователя</button>

<form onSubmit={(e) => e.preventDefault()}>
  <div style={{ marginBottom: 30 }}>
    <h3>Новая привычка</h3>
    <input
      value={newHabit.title}
      onChange={e => setNewHabit({ ...newHabit, title: e.target.value })}
      onKeyDown={e => e.key === 'Enter' && addHabit()}
      placeholder="Название"
      style={{ width: '100%', padding: 8, marginBottom: 8 }}
    />
    <input
      value={newHabit.description}
      onChange={e => setNewHabit({ ...newHabit, description: e.target.value })}
      onKeyDown={e => e.key === 'Enter' && addHabit()}   // ← добавили Enter для описания
      placeholder="Описание (необязательно)"
      style={{ width: '100%', padding: 8, marginBottom: 8 }}
    />
    <button onClick={addHabit}>Добавить</button>
  </div>
</form>

      <h3>Мои привычки</h3>
      {habits.length === 0 && <p>Пока нет привычек. Добавьте первую!</p>}
      {habits.map(habit => (
        <div key={habit.id} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12, borderRadius: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="checkbox"
              checked={habit.completed}
              onChange={e => updateHabit(habit.id, { completed: e.target.checked })}
            />
            <div style={{ flex: 1 }}>
              <strong>{habit.title}</strong>
              {habit.description && <div style={{ fontSize: '0.9em', color: '#555' }}>{habit.description}</div>}
            </div>
            <button onClick={() => deleteHabit(habit.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 4 }}>
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;