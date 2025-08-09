require('dotenv').config(); // Load environment variables

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// ===============================
// MongoDB Connection
// ===============================
(async () => {
  try {
    if (!MONGO_URI) throw new Error('❌ MONGO_URI is missing in environment variables');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
})();

// Schemas
const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true }
}));

const Reel = mongoose.model('Reel', new mongoose.Schema({
  title: { type: String, required: true },
  filename: { type: String, required: true },
  created: { type: Date, default: Date.now }
}));

// Middleware
app.use(cors());
app.use(bodyParser.json());

const corsOptions = {
  origin: 'https://heaven-lab-n1g6.onrender.com',
  credentials: true,
};
app.use(cors(corsOptions));


// Serve uploads folder statically
app.use('/uploads/reels', express.static(path.join(__dirname, 'uploads/reels')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html on root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads/reels')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

// API routes
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });

    const user = await User.findOne({ email, password });
    if (user) return res.json({ success: true, message: 'Login successful' });
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Missing credentials' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ success: false, message: 'User already exists' });

    const newUser = new User({ email, password });
    await newUser.save();
    res.json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

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

app.get('/api/reels', async (req, res) => {
  try {
    const reels = await Reel.find().sort({ created: -1 });
    res.json(reels);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reels', error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
