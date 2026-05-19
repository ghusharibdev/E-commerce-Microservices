const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());

let products = [
    { id: 1, name: 'Laptop', price: 999.99, stock: 10 }
];

app.get('/products', (req, res) => res.json(products));
app.get('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const p = products.find(p => p.id === id);
    p ? res.json(p) : res.status(404).json({ message: 'Not found' });
});
app.post('/products/:id/checkout', (req, res) => {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    const p = products.find(p => p.id === id);
    if (!p) return res.status(404).json({ message: 'Not found' });
    if (p.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' });
    p.stock -= quantity;
    res.json({ message: 'Stock reserved' });
});

describe('Product Service', () => {
    test('GET /products returns all products', async () => {
        const res = await request(app).get('/products');
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBe(1);
    });
    test('GET /products/:id returns product', async () => {
        const res = await request(app).get('/products/1');
        expect(res.statusCode).toBe(200);
        expect(res.body.name).toBe('Laptop');
    });
    test('POST /products/:id/checkout reduces stock', async () => {
        const res = await request(app).post('/products/1/checkout').send({ quantity: 2 });
        expect(res.statusCode).toBe(200);
        expect(products[0].stock).toBe(8);
    });
});