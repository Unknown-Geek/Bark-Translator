const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Multer configuration for audio file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/yourdb');

// Translation Schema
const translationSchema = new mongoose.Schema({
    audioFile: String,
    translation: String,
    timestamp: { type: Date, default: Date.now },
    confidence: Number
});

const Translation = mongoose.model('Translation', translationSchema);

// API Routes
// 1. Upload and translate audio
app.post('/api/translate', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        // Mock translation logic (replace with actual ML model)
        const translation = await translateBark(req.file.path);

        // Save to database
        const newTranslation = new Translation({
            audioFile: req.file.filename,
            translation: translation.text,
            confidence: translation.confidence
        });
        await newTranslation.save();

        res.json({
            success: true,
            translation: translation.text,
            confidence: translation.confidence
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Get translation history
app.get('/api/history', async (req, res) => {
    try {
        const history = await Translation.find()
            .sort({ timestamp: -1 })
            .limit(10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mock translation function (replace with actual ML model)
async function translateBark(audioPath) {
    // Mock translations based on common dog behaviors
    const translations = [
        { text: "I'm hungry! Feed me now!", confidence: 0.89 },
        { text: "Can we go for a walk? Please!", confidence: 0.92 },
        { text: "I love you so much!", confidence: 0.95 },
        { text: "There's someone at the door!", confidence: 0.88 },
        { text: "Play with me! Let's play!", confidence: 0.91 }
    ];
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return translations[Math.floor(Math.random() * translations.length)];
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
// Add this to your existing server.js
app.use(cors({
    origin: 'http://localhost:3000'
  }));
  
  // Make sure uploads directory exists
  const fs = require('fs');
  if (!fs.existsSync('./uploads')){
      fs.mkdirSync('./uploads');
  }