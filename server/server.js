require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..')));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: err.message });
  }
});

// --- JOBS ---
// IMPORTANT: /api/jobs/count must come BEFORE /api/jobs/:id
app.get('/api/jobs/count', async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) FROM jobs');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/jobs', async (req, res) => {
  try {
    const result = await db.query('SELECT data FROM jobs');
    res.json(result.rows.map(row => row.data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/jobs', async (req, res) => {
  try {
    const job = req.body;
    if (!job.id) return res.status(400).json({ error: 'Job id is required' });
    await db.query(
      'INSERT INTO jobs (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2',
      [job.id, job]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM jobs WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CANDIDATES ---
app.get('/api/candidates', async (req, res) => {
  try {
    const result = await db.query("SELECT data FROM candidates ORDER BY (data->>'appliedDate') DESC NULLS LAST");
    res.json(result.rows.map(row => row.data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/candidates', async (req, res) => {
  try {
    const cand = req.body;
    if (!cand.id) return res.status(400).json({ error: 'Candidate id is required' });
    await db.query(
      'INSERT INTO candidates (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2',
      [cand.id, cand]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/candidates/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM candidates WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- HR USERS ---

// Get HR user by username
app.get('/api/hr_users/:username', async (req, res) => {
  try {
    const result = await db.query('SELECT data FROM hr_users WHERE id = $1', [req.params.username]);
    if (result.rows.length > 0) {
      const user = result.rows[0].data;
      // Never return the password in a GET request
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update HR user
app.post('/api/hr_users', async (req, res) => {
  try {
    const user = req.body;
    if (!user.username) return res.status(400).json({ error: 'Username is required' });
    await db.query(
      'INSERT INTO hr_users (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2',
      [user.username, user]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HR Login - verifies username AND password from database
app.post('/api/hr_users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }
    const result = await db.query('SELECT data FROM hr_users WHERE id = $1', [username]);
    if (result.rows.length === 0) {
      return res.json({ success: false, error: 'Invalid credentials' });
    }
    const user = result.rows[0].data;
    // Check password (stored in data.password)
    if (user.password === password) {
      const { password: _pw, ...safeUser } = user;
      return res.json({ success: true, user: safeUser });
    } else {
      return res.json({ success: false, error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change HR user password
app.post('/api/hr_users/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'username, oldPassword and newPassword are required' });
    }
    const result = await db.query('SELECT data FROM hr_users WHERE id = $1', [username]);
    if (result.rows.length === 0) {
      return res.json({ success: false, error: 'User not found' });
    }
    const user = result.rows[0].data;
    if (user.password !== oldPassword) {
      return res.json({ success: false, error: 'Old password is incorrect' });
    }
    user.password = newPassword;
    await db.query('UPDATE hr_users SET data = $1 WHERE id = $2', [user, username]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SETTINGS ---
app.get('/api/settings/global', async (req, res) => {
  try {
    const result = await db.query("SELECT data FROM settings WHERE id = 'global'");
    if (result.rows.length > 0) {
      res.json(result.rows[0].data);
    } else {
      res.json(null);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/global', async (req, res) => {
  try {
    const settings = req.body;
    const existingResult = await db.query("SELECT data FROM settings WHERE id = 'global'");
    let merged = settings;
    if (existingResult.rows.length > 0) {
      merged = { ...existingResult.rows[0].data, ...settings };
    }
    await db.query(
      "INSERT INTO settings (id, data) VALUES ('global', $1) ON CONFLICT (id) DO UPDATE SET data = $1",
      [merged]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PIA Recruitment API Server running on port ${PORT}`);
  console.log(`PostgreSQL connected to: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
});
