
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// In-memory users and books
let users = [{ username: 'admin', password: 'admin' }];
let books = [];

app.use(cors());
app.use(express.json());

// Auth middleware
function auth(req, res, next) {
    const user = req.headers['x-username'];
    if (!user || !users.find(u => u.username === user)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = user;
    next();
}

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        res.json({ success: true });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Register endpoint
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: 'User exists' });
    }
    users.push({ username, password });
    res.json({ success: true });
});

// Get all books
app.get('/api/books', auth, (req, res) => {
    res.json(books);
});

// Add book
app.post('/api/books', auth, (req, res) => {
    books.push({ ...req.body, status: 'Available' });
    res.json({ success: true });
});

// Borrow book
app.post('/api/books/:idx/borrow', auth, (req, res) => {
    const idx = req.params.idx;
    if (books[idx] && books[idx].status === 'Available') {
        books[idx].status = 'Borrowed';
        res.json({ success: true });
    } else {
        res.status(400).json({ message: 'Book unavailable' });
    }
});

// Return book
app.post('/api/books/:idx/return', auth, (req, res) => {
    const idx = req.params.idx;
    if (books[idx] && books[idx].status === 'Borrowed') {
        books[idx].status = 'Available';
        res.json({ success: true });
    } else {
        res.status(400).json({ message: 'Book not borrowed' });
    }
});

// Delete book
app.delete('/api/books/:idx', auth, (req, res) => {
    books.splice(req.params.idx, 1);
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
