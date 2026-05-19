const request = require('supertest');
const express = require('express');
const app = express();
app.use(express.json());
let notes = [];
app.post('/notify', (req, res) => {
    notes.push(req.body);
    res.status(201).json({ message: 'sent' });
});
describe('Notification Service', () => {
    test('POST /notify stores notification', async () => {
        const res = await request(app).post('/notify').send({ userId: 1, message: 'test' });
        expect(res.statusCode).toBe(201);
        expect(notes.length).toBe(1);
    });
});