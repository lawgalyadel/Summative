const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = 3000;

// MongoDB connection
mongoose.connect('mongodb+srv://adellawgaly:<adel2006>@footballpredictions.5rx73.mongodb.net/?retryWrites=true&w=majority&appName=FootballPredictions', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.log('MongoDB connection error:', err));

// Define Mongoose schema for Predictions
const predictionSchema = new mongoose.Schema({
    league: { type: String, required: true },
    name: { type: String, required: true },
    predictions: {
        topScorer: { type: String, required: true },
        playerOfTheSeason: { type: String, required: true },
        youngPlayerOfTheSeason: { type: String, required: true },
        goldenGlove: { type: String, required: true },
        signingOfTheSeason: { type: String, required: true },
        topAssister: { type: String, required: true }
    },
    rankings: { type: Object, required: true }
});

const Prediction = mongoose.model('Prediction', predictionSchema);

// Middleware setup
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://127.0.0.1:5500', // Default for local
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Endpoint to get league data (static)
app.get('/data.json', (req, res) => {
    fs.readFile(path.join(__dirname, 'public', 'data.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data.json:', err);
            return res.status(500).json({ error: 'Error reading data' });
        }
        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseErr) {
            console.error('Error parsing JSON:', parseErr);
            res.status(500).json({ error: 'Invalid JSON format' });
        }
    });
});

// Endpoint to get all predictions from MongoDB
app.get('/Predictions', async (req, res) => {
    try {
        const predictions = await Prediction.find();
        res.json(predictions);
    } catch (err) {
        console.error("Error fetching predictions:", err);
        res.status(500).json({ error: 'Error fetching predictions' });
    }
});

// Endpoint to submit a prediction
app.post('/PredictionsSubmission', async (req, res) => {
    const predictionData = req.body;
    console.log("Prediction received:", predictionData);

    // Validate data
    if (!predictionData || Object.keys(predictionData).length === 0) {
        return res.status(400).json({ error: "Invalid prediction data" });
    }

    try {
        const newPrediction = new Prediction(predictionData);
        await newPrediction.save();
        res.json({ message: "Prediction submitted successfully!" });
    } catch (err) {
        console.error("Error saving prediction:", err);
        res.status(500).json({ error: 'Error saving prediction' });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});