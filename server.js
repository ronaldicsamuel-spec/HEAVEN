const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB setup
const MONGO_URI = 'mongodb+srv://Samrexton:samuel14@cluster0.mrri4pz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// Schemas
const UserSchema = new mongoose.Schema({ email: String, password: String });
const ReelSchema = new mongoose.Schema({ title: String, filename: String, created: { type: Date, default: Date.now } });
const User = mongoose.model('User', UserSchema);
const Reel = mongoose.model('Reel', ReelSchema);

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads/reels', express.static(path.join(__dirname, 'uploads/reels')));
app.use(bodyParser.json());

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/reels/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });

  const user = await User.findOne({ email, password });
  if (user) return res.json({ success: true, message: 'Login successful' });
  return res.status(401).json({ success: false, message: 'Invalid email or password' });
});

// Register route
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(409).json({ success: false, message: 'User already exists' });

  const newUser = new User({ email, password });
  await newUser.save();
  res.json({ success: true, message: 'User registered successfully' });
});

// Upload route
app.post('/api/upload', upload.single('video'), async (req, res) => {
  if (!req.file || !req.body.title) {
    return res.status(400).json({ success: false, message: 'Missing file or title' });
  }
  const reel = new Reel({ title: req.body.title, filename: req.file.filename });
  await reel.save();
  res.json({ success: true, message: 'Upload successful' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
