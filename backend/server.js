const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting configuration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use('/api/auth/', authLimiter);

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for secure cloud databases like Neon
  },
});

// Verify Database Connection on startup and run migrations
pool.connect(async (err, client, release) => {
  if (err) {
    return console.error('Error acquiring client from Neon pool:', err.stack);
  }
  console.log('Successfully connected to Neon PostgreSQL!');

  // Auto-migrate: add new columns if they don't already exist
  try {
    await client.query(`
      ALTER TABLE "Task"
        ADD COLUMN IF NOT EXISTS priority  TEXT DEFAULT 'NONE',
        ADD COLUMN IF NOT EXISTS "dueDate" DATE DEFAULT NULL;
    `);
    console.log('Database migration complete (priority, dueDate columns ensured).');
  } catch (migrationErr) {
    console.error('Migration error:', migrationErr.message);
  }

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
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// --- Request Validation Middlewares ---

const validateAuthPayload = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  
  // Sanitize by trimming
  req.body.email = email.trim();
  next();
};

const validateTaskPayload = (req, res, next) => {
  const { title, description, status, priority, dueDate } = req.body;

  const validPriorities = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const validStatuses   = ['TODO', 'IN_PROGRESS', 'DONE'];

  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Task title is required and cannot be empty' });
    }
  }

  if (req.method === 'PUT') {
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({ error: 'Task title cannot be empty' });
    }
    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid task status' });
    }
  }

  if (priority !== undefined && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority. Must be NONE, LOW, MEDIUM, HIGH, or CRITICAL' });
  }

  if (dueDate !== undefined && dueDate !== null && isNaN(Date.parse(dueDate))) {
    return res.status(400).json({ error: 'Invalid due date format' });
  }

  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({ error: 'Description must be text' });
  }

  // Sanitize
  if (title) req.body.title = title.trim();
  if (description) req.body.description = description.trim();
  
  next();
};

/* ==========================================================================
   AUTH ROUTES
   ========================================================================== */

// 1. REGISTER USER
app.post('/api/auth/register', validateAuthPayload, async (req, res) => {
  const { email, password } = req.body;

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
app.post('/api/auth/login', validateAuthPayload, async (req, res) => {
  const { email, password } = req.body;

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
app.post('/api/tasks', authenticateToken, validateTaskPayload, async (req, res) => {
  const { title, description, priority, dueDate } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO "Task" (title, description, status, priority, "dueDate", "userId") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description || '', 'TODO', priority || 'NONE', dueDate || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// 5. UPDATE TASK (Title, Description, Status, Priority, Due Date)
app.put('/api/tasks/:id', authenticateToken, validateTaskPayload, async (req, res) => {
  const { id } = req.params;
  const { title, description, status, priority, dueDate } = req.body;

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
    const updatedTitle       = title       !== undefined ? title       : task.title;
    const updatedDescription = description !== undefined ? description : task.description;
    const updatedStatus      = status      !== undefined ? status      : task.status;
    const updatedPriority    = priority    !== undefined ? priority    : task.priority;
    const updatedDueDate     = dueDate     !== undefined ? dueDate     : task["dueDate"];

    const result = await pool.query(
      'UPDATE "Task" SET title = $1, description = $2, status = $3, priority = $4, "dueDate" = $5 WHERE id = $6 AND "userId" = $7 RETURNING *',
      [updatedTitle, updatedDescription, updatedStatus, updatedPriority, updatedDueDate || null, id, req.user.id]
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