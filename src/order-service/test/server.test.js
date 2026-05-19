const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
const JWT_SECRET = 'test-secret';

function authenticate(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'No token' });
    const token = auth.split(' ')[1];
    try { req.user = jwt.verify(token, JWT_SECRET); next(); } catch(e) { res.status(401).json({ message: 'Invalid token' }); }
}

app.post('/orders', authenticate, (req, res) => {
    res.status(201).json({ message: 'Order placed', orderId: 1 });
});

describe('Order Service', () => {
    test('POST /orders with valid token returns 201', async () => {
        const token = jwt.sign({ userId: 1 }, JWT_SECRET);
        const res = await request(app)
            .post('/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: 1, quantity: 1 });
        expect(res.statusCode).toBe(201);
    });
});