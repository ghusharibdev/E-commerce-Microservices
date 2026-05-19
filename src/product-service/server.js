const express = require('express');
const app = express();
app.use(express.json());

// In-memory products
const products = [
    { id: 1, name: 'Laptop', price: 999.99, stock: 10, description: 'High performance laptop' },
    { id: 2, name: 'Mouse', price: 19.99, stock: 50, description: 'Wireless mouse' },
    { id: 3, name: 'Keyboard', price: 49.99, stock: 30, description: 'Mechanical keyboard' }
];

// Get all products
app.get('/products', (req, res) => {
    res.json(products);
});

// Get one product
app.get('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
});

// Check and reduce stock (called by Order service)
app.post('/products/:id/checkout', (req, res) => {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    const product = products.find(p => p.id === id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.stock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock', available: product.stock });
    }
    // Reduce stock (for demo; normally you'd have a transaction)
    product.stock -= quantity;
    res.json({ message: 'Stock reserved', remainingStock: product.stock });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Product service on port ${PORT}`));