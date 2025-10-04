const express = require('express');
const storage = require('node-persist');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.static('public')); // Serve frontend from /public

// Initialize node-persist (JSON-based storage)
async function initStorage() {
  await storage.init({
    dir: './persist', // Centralized storage directory
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: 'utf8',
    logging: false, // Set to true for debug logs
    ttl: false, // No expiration
    forgiveParseErrors: true, // Handle any corrupt files
    writeQueue: true // Prevent file corruption
  });
  console.log('Node-persist initialized. Storage in ./persist');
}

// JSON Model: Users as array of { id, name, email }
let users = []; // In-memory cache (loaded from storage)

// Load users on startup
async function loadUsers() {
  users = await storage.getItem('users') || [];
  console.log(`Loaded ${users.length} users from storage`);
}

// Save users to storage
async function saveUsers() {
  await storage.setItem('users', users);
  console.log('Users saved to storage');
}

// API Routes
// POST /register: Add user (centralized)
app.post('/register', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }
    const id = Math.random().toString(36).substr(2, 9); // Simple ID
    const newUser = { id, name, email, timestamp: new Date().toISOString() };
    users.push(newUser);
    await saveUsers(); // Persist to JSON file
    console.log('New registration:', newUser);
    res.json({ success: true, user: newUser });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /users: Retrieve all users (for admin/debug)
app.get('/users', async (req, res) => {
  res.json({ users });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
initStorage().then(loadUsers).then(() => {
  app.listen(PORT, () => {
    console.log(`DeFi Quest server running at http://localhost:${PORT}`);
  });
});
