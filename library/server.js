const express = require('express');
const cors = require('cors');
const argon2 = require('argon2');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;

// Data files
const USERS_FILE = path.join(__dirname, 'users.json');
const BOOKS_FILE = path.join(__dirname, 'books.json');

const SECRET = 'superSecret.0@'; 

// Load or initialize users and books
let users = loadJson(USERS_FILE, []);
let books = loadJson(BOOKS_FILE, []);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Helper Functions ----------
function loadJson(filePath, fallback) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err);
    }
    return fallback;
}

function saveJson(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
        console.error(`Error writing ${filePath}:`, err);
    }
}

// ---------- Auth Middleware ----------
function auth(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, SECRET);
        req.user = payload.username;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname,  'index.html'));
});

// ---------- Auth Endpoints ----------

// Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: 'User already exists' });
    }
    try {
        const hash = await argon2.hash(password);
        users.push({ username, hash });
        saveJson(USERS_FILE, users);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Registration failed' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    try {
        const valid = await argon2.verify(user.hash, password);
        if (valid) {
            const token = jwt.sign({ username }, SECRET, { expiresIn: '1h' });

            res.json({ success: true, token: token });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch {
        res.status(500).json({ message: 'Verification error' });
    }
});

// ---------- Book Endpoints ----------

app.get('/api/books', auth, (req, res) => {
    res.json(books);
});

app.post('/api/books', auth, (req, res) => {
    const book = {
        id: Date.now(), // Use current timestamp as a unique ID
        ...req.body,
        status: 'Available'
    };
    books.push(book);
    saveJson(BOOKS_FILE, books);
    res.json({ success: true });
});

app.post('/api/books/:id/borrow', auth, (req, res) => {
    const bookId = parseInt(req.params.id);
    const book = books.find(b => b.id === bookId);

    if (book && book.status === 'Available') {
        book.status = 'Borrowed';
        saveJson(BOOKS_FILE, books);
        res.json({ success: true });
    } else {
        res.status(400).json({ message: 'Book unavailable or not found' });
    }
});

app.post('/api/books/:id/return', auth, (req, res) => {
    const bookId = parseInt(req.params.id);
    const book = books.find(b => b.id === bookId);

    if (book && book.status === 'Borrowed') {
        book.status = 'Available';
        saveJson(BOOKS_FILE, books);
        res.json({ success: true });
    } else {
        res.status(400).json({ message: 'Book not borrowed or not found' });
    }
});


app.delete('/api/books/:id', auth, (req, res) => {
    const bookId = parseInt(req.params.id);
    const index = books.findIndex(b => b.id === bookId);

    if (index !== -1) {
        books.splice(index, 1);
        saveJson(BOOKS_FILE, books);
        res.json({ success: true });
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
});


// ---------- Start Server ----------
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
