const request = require('supertest');
const { app, assignCall, selectFloor, STATE } = require('./server');

describe('Elevator System Tests', () => {
  beforeEach(() => {
    // Reset the state before each test
    STATE.elevators = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      current_floor: 0,
      target_floors: [],
      direction: 'idle',
      doors_open: false,
    }));
  });

  test('assignCall assigns the nearest elevator', () => {
    assignCall(5, 'up');
    expect(STATE.elevators[0].target_floors).toContain(5);
  });

  test('selectFloor adds a floor to the target list', () => {
    selectFloor(0, 3);
    expect(STATE.elevators[0].target_floors).toContain(3);
  });

  test('GET /status returns the current state of elevators', async () => {
    const response = await request(app).get('/status');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(STATE.elevators);
  });

  test('POST /call assigns a call to an elevator', async () => {
    const response = await request(app)
      .post('/call')
      .send({ floor: 2, direction: 'up' });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Elevator requested');
    expect(STATE.elevators[0].target_floors).toContain(2);
  });

  test('POST /select adds a floor to the elevator target list', async () => {
    const response = await request(app)
      .post('/select')
      .send({ elevator_id: 0, target_floor: 4 });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Floor selected');
    expect(STATE.elevators[0].target_floors).toContain(4);
  });
});
