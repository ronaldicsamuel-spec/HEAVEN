require('dotenv').config(); // Load environment variables

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// ===============================
// MongoDB Connection (Mongoose v7+)
// ===============================
(async () => {
  try {
    if (!MONGO_URI) {
      throw new Error('❌ MONGO_URI is missing in environment variables');
    }
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
})();

// ===============================
// Schemas & Models
// ===============================
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true }
});

const ReelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  filename: { type: String, required: true },
  created: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Reel = mongoose.model('Reel', ReelSchema);

// ===============================
// Middleware
// ===============================
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads/reels', express.static(path.join(__dirname, 'uploads/reels')));
app.use(bodyParser.json());

// ===============================
// Multer Setup
// ===============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads/reels/'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

// ===============================
// Debug Route to Test MongoDB
// ===============================
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await mongoose.connection.db.admin().ping();
    res.json({ success: true, message: 'MongoDB connection is working', result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'MongoDB connection failed', error: err.message });
  }
});

// ===============================
// Auth Routes
// ===============================
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Missing credentials' });

    const user = await User.findOne({ email, password });
    if (user) {
      return res.json({ success: true, message: 'Login successful' });
    }
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Missing credentials' });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ success: false, message: 'User already exists' });

    const newUser = new User({ email, password });
    await newUser.save();
    res.json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ===============================
// Reel Upload Route
// ===============================
app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file || !req.body.title) {
      return res.status(400).json({ success: false, message: 'Missing file or title' });
    }
    const reel = new Reel({ title: req.body.title, filename: req.file.filename });
    await reel.save();
    res.json({ success: true, message: 'Upload successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ===============================
// Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
