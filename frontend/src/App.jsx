// src/App.jsx
import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const FLOORS = 10;
const ELEVATORS = 3;

const Elevator = ({ elevator }) => (
  <div className="text-center">
    <div className={`border p-2 rounded ${elevator.doors_open ? 'bg-success text-white' : 'bg-primary text-white'}`}>
      {elevator.current_floor}
    </div>
    <small>#{elevator.id}</small>
  </div>
);

const FloorControls = ({ floor, onCall }) => (
  <div className="btn-group">
    <button className="btn btn-outline-secondary btn-sm" onClick={() => onCall(floor, 'up')}>↑</button>
    <button className="btn btn-outline-secondary btn-sm" onClick={() => onCall(floor, 'down')}>↓</button>
  </div>
);

export default function App() {
  const [elevators, setElevators] = useState(Array(ELEVATORS).fill({ current_floor: 0, id: 0, doors_open: false }));

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001');
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setElevators(data);
    };
    return () => socket.close();
  }, []);

  const callElevator = async (floor, direction) => {
    await fetch('http://localhost:3001/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ floor, direction }),
    });
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Elevator System Simulation</h2>
      <div className="row flex-column-reverse">
        {[...Array(FLOORS)].map((_, floor) => (
          <div key={floor} className="d-flex align-items-center gap-3 my-1">
            <div className="text-end w-25">{FLOORS - 1 - floor}</div>
            <FloorControls floor={FLOORS - 1 - floor} onCall={callElevator} />
            {elevators.map(e => (
              <div key={e.id} className="mx-1 w-25">
                {e.current_floor === FLOORS - 1 - floor ? <Elevator elevator={e} /> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
