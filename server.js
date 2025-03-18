const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;
const cors = require('cors');
const predictionsFile = path.join(__dirname, 'predictions.json');
app.use(cors({
    origin: 'http://127.0.0.1:5500', 
    methods: ['GET', 'POST'],  
    allowedHeaders: ['Content-Type']
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
const loadPredictions = () => {
    try {
        if (!fs.existsSync(predictionsFile)) {
            return [];  // File doesn't exist, return empty array
        }
        const data = fs.readFileSync(predictionsFile, 'utf8');
        
        if (!data.trim()) {  // If file is empty or only spaces/newlines
            return [];
        }
        
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading or parsing predictions file:", err);
        return [];
    }
};
const savePredictions = (predictions) => {
    fs.writeFileSync(predictionsFile, JSON.stringify(predictions, null, 2));
};

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
app.get('/Predictions', (req, res) => {
    const predictions = loadPredictions();
    res.json(predictions);
});
app.post('/PredictionsSubmission', (req, res) => {
    const predictionData = req.body;
    console.log("Prediction received:", predictionData);
    if (!predictionData || Object.keys(predictionData).length === 0) {
        return res.status(400).json({ error: "Invalid prediction data" });
    }
    let predictions = loadPredictions();
    predictions.push(predictionData);
    savePredictions(predictions);
    res.json({ message: "Prediction submitted successfully!" });
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});