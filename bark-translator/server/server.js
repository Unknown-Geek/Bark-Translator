const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
// Comment out mongoose for now
// const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// CORS Configuration
app.use(cors({
    origin: 'http://localhost:3001', // Your React app's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
}));

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

// Comment out MongoDB connection and schemas
// Instead, use in-memory storage for history
let translations = [];

// API Routes
app.post('/api/translate', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const translation = await translateBark(req.file.path);
        const patterns = analyzePatterns(req.file.path);

        // Store in memory instead of database
        const newTranslation = {
            audioFile: req.file.filename,
            translation: translation.text,
            confidence: translation.confidence,
            sentiment: translation.sentiment,
            patterns,
            timestamp: new Date()
        };
        
        translations.push(newTranslation);

        res.json({
            success: true,
            translation: translation.text,
            confidence: translation.confidence,
            sentiment: translation.sentiment,
            patterns
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        // Return in-memory translations instead of database query
        const history = translations
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mock translation function with more realistic responses
async function translateBark(audioPath) {
    const defaultTranslations = [
        "Hello! I'm excited to see you!",
        "I need attention!",
        "I'm hungry!",
        "Let's play!",
        "I hear something!",
        "I love you!",
        "Can we go for a walk?"
    ];

    const sentiments = {
        happy: { mood: "Happy", intensity: 0.9 },
        excited: { mood: "Excited", intensity: 0.8 },
        alert: { mood: "Alert", intensity: 0.7 },
        hungry: { mood: "Hungry", intensity: 0.6 },
        playful: { mood: "Playful", intensity: 0.9 }
    };

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Randomly select translation and sentiment
    const text = defaultTranslations[Math.floor(Math.random() * defaultTranslations.length)];
    const sentimentKeys = Object.keys(sentiments);
    const sentiment = sentiments[sentimentKeys[Math.floor(Math.random() * sentimentKeys.length)]];

    return {
        text,
        confidence: 0.8 + Math.random() * 0.2,
        sentiment
    };
}

// Function to analyze bark patterns (mock)
function analyzePatterns(audioPath) {
    return ["Short bark", "Medium pitch", "Repeated pattern"];
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Make sure uploads directory exists
const fs = require('fs');
if (!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}