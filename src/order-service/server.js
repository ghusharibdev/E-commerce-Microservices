const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const PRODUCT_SVC_URL = process.env.PRODUCT_SVC_URL || 'http://localhost:3002';
const NOTIFICATION_SVC_URL = process.env.NOTIFICATION_SVC_URL || 'http://localhost:3004';

const orders = []; // in-memory

// Middleware to verify JWT
function authenticate(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'No token' });
    const token = auth.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
}

// Place order
app.post('/orders', authenticate, async (req, res) => {
    const { productId, quantity } = req.body;
    if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Product ID and positive quantity required' });
    }

    try {
        // Call Product Service to check and reserve stock
        const productRes = await axios.post(`${PRODUCT_SVC_URL}/products/${productId}/checkout`, { quantity });
        if (productRes.status !== 200) {
            return res.status(400).json({ message: 'Stock error' });
        }
        // Create order
        const orderId = orders.length + 1;
        const order = {
            id: orderId,
            userId: req.user.userId,
            productId,
            quantity,
            status: 'confirmed',
            timestamp: new Date().toISOString()
        };
        orders.push(order);

        // Notify user asynchronously (fire and forget)
        axios.post(`${NOTIFICATION_SVC_URL}/notify`, {
            userId: req.user.userId,
            message: `Order ${orderId} confirmed for product ${productId}, quantity ${quantity}`
        }).catch(err => console.error('Notification failed', err.message));

        res.status(201).json({ message: 'Order placed', orderId });
    } catch (err) {
        console.error(err);
        if (err.response) {
            return res.status(err.response.status).json(err.response.data);
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get orders for a user (protected)
app.get('/orders', authenticate, (req, res) => {
    const userOrders = orders.filter(o => o.userId === req.user.userId);
    res.json(userOrders);
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Order service on port ${PORT}`));