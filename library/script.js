const API_URL = 'http://localhost:3001/api';

function showLogin() {
    document.getElementById('loginContainer').classList.remove('d-none');
    document.getElementById('appContainer').classList.add('d-none');
    document.getElementById('logoutBtn').classList.add('d-none');
    document.getElementById('currentUser').textContent = '';
}

function showApp() {
    document.getElementById('loginContainer').classList.add('d-none');
    document.getElementById('appContainer').classList.remove('d-none');
    document.getElementById('logoutBtn').classList.remove('d-none');
    document.getElementById('currentUser').textContent = localStorage.getItem('username');
}

function isLoggedIn() {
    return !!localStorage.getItem('username');
}

// ---------- AUTH ----------
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (res.ok) {
            localStorage.setItem('username', username);
            showApp();
            loadBooks();
        } else {
            alert('Login failed!');
        }
    } catch {
        alert('Login error');
    }
});

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (res.ok) {
            alert('Registered! You can now login.');
        } else {
            alert('Registration failed!');
        }
    } catch {
        alert('Registration error');
    }
});

document.getElementById('logoutBtn').onclick = function() {
    localStorage.removeItem('username');
    showLogin();
};

// ---------- APP ----------
async function loadBooks() {
    try {
        const res = await fetch(`${API_URL}/books`, {
            headers: { 'x-username': localStorage.getItem('username') }
        });
        if (!res.ok) throw new Error();
        const books = await res.json();
        renderBooks(books);
    } catch {
        alert('Failed to load books. Please login again.');
        showLogin();
    }
}

function renderBooks(books) {
    const grid = document.getElementById('booksGrid');
    grid.innerHTML = '';
    if (books.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-muted">No books available.</div>';
        return;
    }
    books.forEach((book, idx) => {
        // Card
        const col = document.createElement('div');
        col.className = 'col-sm-6 col-md-4 col-lg-3 d-flex';
        col.innerHTML = `
            <div class="card shadow-sm book-card flex-fill">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${book.title}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${book.author}</h6>
                    <div class="mb-2"><span class="text-secondary">ISBN:</span> ${book.isbn}</div>
                    <span class="badge badge-status ${book.status === 'Available' ? 'bg-success' : 'bg-warning text-dark'} mb-3">
                        <i class="bi ${book.status === 'Available' ? 'bi-check-circle-fill' : 'bi-clock-history'}"></i> 
                        ${book.status}
                    </span>
                    <div class="mt-auto d-flex gap-2">
                        ${book.status === 'Available'
                            ? `<button class="btn btn-action btn-outline-success btn-sm flex-fill" onclick="borrowBook(${idx})"><i class="bi bi-box-arrow-in-right"></i> Borrow</button>`
                            : `<button class="btn btn-action btn-outline-warning btn-sm flex-fill" onclick="returnBook(${idx})"><i class="bi bi-arrow-counterclockwise"></i> Return</button>`
                        }
                        <button class="btn btn-action btn-outline-danger btn-sm flex-fill" onclick="deleteBook(${idx})"><i class="bi bi-trash"></i> Delete</button>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
}

document.getElementById('bookForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const isbn = document.getElementById('isbn').value.trim();

    if (title && author && isbn) {
        await fetch(`${API_URL}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-username': localStorage.getItem('username')
            },
            body: JSON.stringify({ title, author, isbn })
        });
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addBookModal'));
        modal.hide();
        loadBooks();
        this.reset();
    }
});

window.borrowBook = async function(idx) {
    await fetch(`${API_URL}/books/${idx}/borrow`, {
        method: 'POST',
        headers: { 'x-username': localStorage.getItem('username') }
    });
    loadBooks();
};

window.returnBook = async function(idx) {
    await fetch(`${API_URL}/books/${idx}/return`, {
        method: 'POST',
        headers: { 'x-username': localStorage.getItem('username') }
    });
    loadBooks();
};

window.deleteBook = async function(idx) {
    if (confirm('Are you sure you want to delete this book?')) {
        await fetch(`${API_URL}/books/${idx}`, {
            method: 'DELETE',
            headers: { 'x-username': localStorage.getItem('username') }
        });
        loadBooks();
    }
};

// --------- INIT ---------
if (isLoggedIn()) {
    showApp();
    loadBooks();
} else {
    showLogin();
}