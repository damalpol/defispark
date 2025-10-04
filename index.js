const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = 3000;

// Initialize Supabase client
const supabaseUrl = 'https://vepzznfymiqzqrxdhgna.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlcHp6bmZ5bWlxenFyeGRoZ25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MDMyNDAsImV4cCI6MjA3NTE3OTI0MH0.yBi8jhSCXB6IDM732hu2ab_uiZHa1FFbkBDLczoERR8'; // Replace with your Supabase anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.static('public')); // Serve frontend from /public

// API Routes
// POST /register: Add user
app.post('/register', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }

    // Insert user into Supabase 'users' table
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email }])
      .select(); // Return the inserted user

    if (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Failed to register user' });
    }

    const newUser = data[0]; // Get the inserted user data
    console.log('New registration:', newUser);
    res.json({ success: true, user: newUser });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /users: Retrieve all users (for admin/debug)
app.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    console.log(`Fetched ${data.length} users from Supabase`);
    res.json({ users: data });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`DeFi Quest server running at http://localhost:${PORT}`);
});
