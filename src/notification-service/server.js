const express = require('express');
const app = express();
app.use(express.json());

// In-memory log of notifications
const notifications = [];

app.post('/notify', (req, res) => {
    const { userId, message } = req.body;
    if (!userId || !message) {
        return res.status(400).json({ message: 'userId and message required' });
    }
    const notification = { userId, message, timestamp: new Date().toISOString() };
    notifications.push(notification);
    console.log(`[NOTIFICATION] User ${userId}: ${message}`);
    res.status(201).json({ message: 'Notification sent' });
});

// Optional: get notifications for a user
app.get('/notifications/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const userNotes = notifications.filter(n => n.userId === userId);
    res.json(userNotes);
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Notification service on port ${PORT}`));