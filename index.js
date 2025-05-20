const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;


let totalTime = 15 * 60; // in seconds
let currentTime = totalTime;
let timerPaused = true;
let interval = null;

app.use(express.static('public'));
app.use(bodyParser.json());

function startTimer() {
    clearInterval(interval);
    interval = setInterval(() => {
        if (!timerPaused && currentTime > 0) {
            currentTime--;
        }
    }, 1000);
}

app.get('/time', (req, res) => {
    res.json({ currentTime, totalTime, timerPaused });
});

app.post('/toggle-timer', (req, res) => {
    timerPaused = !timerPaused;
    startTimer();
    res.sendStatus(200);
});

app.post('/reset', (req, res) => {
    currentTime = totalTime;
    timerPaused = true;
    res.sendStatus(200);
});

app.post('/set-time', (req, res) => {
    const minutes = parseInt(req.body.minutes);
    if (!isNaN(minutes) && minutes > 0) {
        totalTime = minutes * 60;
        currentTime = totalTime;
        timerPaused = true;
        startTimer();
        res.sendStatus(200);
    } else {
        res.status(400).send("Invalid time");
    }
});

app.listen(3000, () => {
    console.log('Timer running at http://localhost:3000');
});
