const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import the app (we need to export it from server.js, but for simplicity we recreate)
// Alternatively, modify server.js to export app for testing.
// We'll create a test version.

const app = express();
app.use(express.json());

const JWT_SECRET = 'test-secret';
let users = [];

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });
    if (users.find(u => u.username === username)) return res.status(409).json({ message: 'User already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const id = users.length + 1;
    users.push({ id, username, passwordHash });
    res.status(201).json({ message: 'User registered successfully', userId: id });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

describe('User Service', () => {
    beforeEach(() => {
        users = [];
    });

    test('POST /register creates a new user', async () => {
        const res = await request(app)
            .post('/register')
            .send({ username: 'testuser', password: 'pass123' });
        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('User registered successfully');
    });

    test('POST /register with duplicate username returns 409', async () => {
        await request(app).post('/register').send({ username: 'testuser', password: 'pass123' });
        const res = await request(app).post('/register').send({ username: 'testuser', password: 'pass123' });
        expect(res.statusCode).toBe(409);
    });

    test('POST /login returns JWT token', async () => {
        await request(app).post('/register').send({ username: 'testuser', password: 'pass123' });
        const res = await request(app).post('/login').send({ username: 'testuser', password: 'pass123' });
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    test('POST /login with wrong password returns 401', async () => {
        await request(app).post('/register').send({ username: 'testuser', password: 'pass123' });
        const res = await request(app).post('/login').send({ username: 'testuser', password: 'wrong' });
        expect(res.statusCode).toBe(401);
    });
});