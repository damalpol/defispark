const express = require('express');
const Loki = require('lokijs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize LokiJS
let db;
let usersCollection;

async function initStorage() {
  return new Promise((resolve, reject) => {
    db = new Loki('defi-quest.db', {
      autoload: true,
      autosave: true,
      autosaveInterval: 4000, // Save every 4 seconds
      persistenceMethod: 'fs' // Use filesystem for persistence
    });

    db.loadDatabase({}, (err) => {
      if (err) {
        console.error('Error loading database:', err);
        reject(err);
        return;
      }

      // Get or create users collection
      usersCollection = db.getCollection('users') || db.addCollection('users');
      console.log('LokiJS initialized. Database: defi-quest.db');
      resolve();
    });
  });
}

// API Routes
// POST /register: Add user
app.post('/register', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }
    const id = Math.random().toString(36).substr(2, 9);
    const newUser = {
      id,
      name,
      email,
      timestamp: new Date().toISOString()
    };
    
    usersCollection.insert(newUser);
    db.saveDatabase((err) => {
      if (err) {
        console.error('Error saving database:', err);
      } else {
        console.log('New registration:', newUser);
      }
    });
    
    res.json({ success: true, user: newUser });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /users: Retrieve all users
app.get('/users', async (req, res) => {
  const users = usersCollection.chain().data();
  res.json({ users });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
initStorage().then(() => {
  app.listen(PORT, () => {
    console.log(`DeFi Quest server running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize storage:', err);
  process.exit(1);
});
