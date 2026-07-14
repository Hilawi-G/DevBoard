const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for secure cloud databases like Neon
  },
});

// Verify Database Connection on startup
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client from Neon pool:', err.stack);
  }
  console.log('Successfully connected to Neon PostgreSQL!');
  release();
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

/* ==========================================================================
   AUTH ROUTES
   ========================================================================== */

// 1. REGISTER USER
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO "User" (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation (duplicate email)
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. LOGIN USER
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM "User" WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/* ==========================================================================
   TASK ROUTES (GUARDED BY JWT)
   ========================================================================== */

// 3. GET USER'S TASKS
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM "Task" WHERE "userId" = $1 ORDER BY id DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

// 4. CREATE NEW TASK
app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO "Task" (title, description, status, "userId") VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description || '', 'TODO', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// 5. UPDATE TASK (Title, Description, or Status)
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;

  try {
    // Check if task exists and belongs to the logged-in user
    const checkTask = await pool.query(
      'SELECT * FROM "Task" WHERE id = $1 AND "userId" = $2',
      [id, req.user.id]
    );

    if (checkTask.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const task = checkTask.rows[0];
    const updatedTitle = title !== undefined ? title : task.title;
    const updatedDescription = description !== undefined ? description : task.description;
    const updatedStatus = status !== undefined ? status : task.status;

    const result = await pool.query(
      'UPDATE "Task" SET title = $1, description = $2, status = $3 WHERE id = $4 AND "userId" = $5 RETURNING *',
      [updatedTitle, updatedDescription, updatedStatus, id, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// 6. DELETE TASK
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM "Task" WHERE id = $1 AND "userId" = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});