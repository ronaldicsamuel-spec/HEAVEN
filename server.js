require('dotenv').config();

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// MongoDB Connection
(async () => {
  try {
    if (!MONGO_URI) throw new Error('MONGO_URI missing in .env');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
})();

// Schemas
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const ReelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  filename: { type: String, required: true },
  created: { type: Date, default: Date.now }
});
const Reel = mongoose.model('Reel', ReelSchema);

// Middleware
app.use(cors({
  origin: 'https://heaven-lab-n1g6.onrender.com',
  credentials: true,
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads/reels', express.static(path.join(__dirname, 'uploads/reels')));

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts, please try later." }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many uploads, please try later." }
});

// Multer setup with file type and size check (max 50MB)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads/reels')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) cb(null, true);
  else cb(new Error('Only video files are allowed'), false);
};
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 }, fileFilter });

// Routes

// Registration
app.post('/api/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const { email, password } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser)
        return res.status(409).json({ success: false, message: 'User already exists' });

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = new User({ email, passwordHash });
      await newUser.save();

      res.json({ success: true, message: 'User registered successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  }
);

// Login
app.post('/api/login', loginLimiter,
  body('email').isEmail(),
  body('password').exists(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ success: false, errors: errors.array() });

      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user)
        return res.status(401).json({ success: false, message: 'Invalid email or password' });

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch)
        return res.status(401).json({ success: false, message: 'Invalid email or password' });

      // Issue JWT token
      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ success: true, message: 'Login successful', token });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
  }
);

// Upload reel (protected route example: token required)
app.post('/api/upload', uploadLimiter, upload.single('video'), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, message: 'Authorization header missing' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Token missing' });

    // Verify JWT token
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) return res.status(401).json({ success: false, message: 'Invalid token' });

      if (!req.file || !req.body.title) {
        return res.status(400).json({ success: false, message: 'Missing file or title' });
      }

      const reel = new Reel({ title: req.body.title, filename: req.file.filename });
      await reel.save();
      res.json({ success: true, message: 'Upload successful' });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Get reels (public)
app.get('/api/reels', async (req, res) => {
  try {
    const reels = await Reel.find().sort({ created: -1 });
    res.json(reels);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reels', error: err.message });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
