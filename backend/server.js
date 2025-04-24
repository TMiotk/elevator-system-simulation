const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const FLOORS = 10;
const ELEVATOR_COUNT = 3;

const STATE = {
  elevators: Array.from({ length: ELEVATOR_COUNT }, (_, i) => ({
    id: i,
    current_floor: 0,
    target_floors: [],
    direction: 'idle',
    doors_open: false
  })),
  sockets: []
};

function broadcastState() {
  const data = JSON.stringify(STATE.elevators);
  STATE.sockets.forEach(ws => ws.readyState === WebSocket.OPEN && ws.send(data));
}

function assignCall(floor, direction) {
  let best = null, minDist = FLOORS + 1;
  STATE.elevators.forEach(e => {
    const dist = Math.abs(e.current_floor - floor);
    if (dist < minDist) {
      best = e;
      minDist = dist;
    }
  });
  if (!best.target_floors.includes(floor)) {
    best.target_floors.push(floor);
    best.target_floors.sort((a, b) => a - b);
  }
}

function selectFloor(elevatorId, floor) {
  const e = STATE.elevators[elevatorId];
  if (!e.target_floors.includes(floor)) {
    e.target_floors.push(floor);
    e.target_floors.sort((a, b) => a - b);
  }
}

app.get('/status', (req, res) => {
  res.json(STATE.elevators);
});

app.post('/call', (req, res) => {
  const { floor, direction } = req.body;
  assignCall(floor, direction);
  res.json({ message: 'Elevator requested' });
});

app.post('/select', (req, res) => {
  const { elevator_id, target_floor } = req.body;
  selectFloor(elevator_id, target_floor);
  res.json({ message: 'Floor selected' });
});

wss.on('connection', ws => {
  STATE.sockets.push(ws);
  ws.send(JSON.stringify(STATE.elevators));
  ws.on('close', () => {
    STATE.sockets = STATE.sockets.filter(s => s !== ws);
  });
});

function simulationLoop() {
  setInterval(() => {
    STATE.elevators.forEach(e => {
      if (e.target_floors.length === 0) {
        e.direction = 'idle';
        return;
      }
      const next = e.target_floors[0];
      if (e.current_floor < next) {
        e.current_floor++;
        e.direction = 'up';
      } else if (e.current_floor > next) {
        e.current_floor--;
        e.direction = 'down';
      } else {
        e.target_floors.shift();
        e.doors_open = true;
        setTimeout(() => {
          e.doors_open = false;
          broadcastState();
        }, 1000);
      }
    });
    broadcastState();
  }, 1000);
}

server.listen(3001, () => {
  console.log('Backend running on http://localhost:3001');
});
simulationLoop();

module.exports = { app, assignCall, selectFloor, STATE };
