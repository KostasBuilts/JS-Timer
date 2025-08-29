const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// -------- Timer State --------
let totalTime = 15 * 60;   // seconds
let currentTime = totalTime;
let timerPaused = true;
let interval = null;

// -------- Queue State (server-side) --------
// item: { id:number, minutes:number, alias:string }
let queue = [];
let nextId = 1;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

function tick() {
  if (!timerPaused) {
    currentTime--; // allow to go negative for overtime
  }
}

function startInterval() {
  if (interval) clearInterval(interval);
  interval = setInterval(tick, 1000);
}
startInterval();

// ---------- Timer API ----------
app.get('/time', (req, res) => {
  res.json({ currentTime, totalTime, timerPaused });
});

app.post('/toggle-timer', (req, res) => {
  timerPaused = !timerPaused;
  startInterval();
  res.sendStatus(200);
});

app.post('/reset', (req, res) => {
  currentTime = totalTime;
  timerPaused = true;
  res.sendStatus(200);
});

app.post('/set-time', (req, res) => {
  const minutes = parseInt(req.body.minutes, 10);
  if (isNaN(minutes) || minutes <= 0) {
    return res.status(400).send('Invalid time');
  }
  totalTime = minutes * 60;
  currentTime = totalTime;
  timerPaused = true; // do not auto start
  startInterval();
  res.sendStatus(200);
});

// ---------- Queue API ----------
app.get('/queue', (req, res) => {
  res.json(queue);
});

app.post('/queue', (req, res) => {
  const { minutes, alias } = req.body;
  const m = parseInt(minutes, 10);
  if (isNaN(m) || m <= 0) return res.status(400).send('Invalid minutes');
  const item = { id: nextId++, minutes: m, alias: alias ? String(alias) : '' };
  queue.push(item);
  res.json(item);
});

app.put('/queue/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = queue.find(q => q.id === id);
  if (!item) return res.status(404).send('Not found');

  const { minutes, alias } = req.body;
  if (minutes !== undefined) {
    const m = parseInt(minutes, 10);
    if (isNaN(m) || m <= 0) return res.status(400).send('Invalid minutes');
    item.minutes = m;
  }
  if (alias !== undefined) item.alias = String(alias);
  res.json(item);
});

app.delete('/queue/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const before = queue.length;
  queue = queue.filter(q => q.id !== id);
  if (queue.length === before) return res.status(404).send('Not found');
  res.sendStatus(200);
});

// Load + auto-dequeue
app.post('/queue/load/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = queue.findIndex(q => q.id === id);
  if (idx === -1) return res.status(404).send('Not found');

  const item = queue.splice(idx, 1)[0];    // remove from queue (auto-dequeue)
  totalTime = item.minutes * 60;
  currentTime = totalTime;
  timerPaused = true;                       // do not auto start
  startInterval();
  res.json(item);
});

// Serve the single-page app
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
