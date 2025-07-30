// script.js

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const registerForm = document.getElementById("registerForm");
const registerBtn = document.getElementById('registerBtn');
const bookForm = document.getElementById("bookForm");
const loginContainer = document.getElementById("loginContainer");
const appContainer = document.getElementById("appContainer");
const logoutBtn = document.getElementById("logoutBtn");
const currentUser = document.getElementById("currentUser");
const booksGrid = document.getElementById("booksGrid");

const API_URL = "http://localhost:3001/api"; // Adjust as needed

// Load books
async function loadBooks() {
  booksGrid.innerHTML = 'Loading Books...';
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/books`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Unauthorized");
    const books = await res.json();
    renderBooks(books);
  } catch (err) {
    alert("Session expired or unauthorized.");
    // logout();
  }
}

function renderBooks(books) {
  booksGrid.innerHTML = '';
  if (books.length === 0) {
      booksGrid.innerHTML = '<div class="col-12 text-center text-muted">No books available.</div>';
      return;
  }

  booksGrid.innerHTML = books.map(
    (b) => `
      <div class="col-sm-6 col-md-4 col-lg-3 d-flex">
        <div class="card shadow-sm book-card flex-fill">
          <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${b.title}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${b.author}</h6>
                    <div class="mb-2"><span class="text-secondary">ISBN:</span> ${b.isbn}</div>
                    <span class="badge badge-status ${b.status === 'Available' ? 'bg-success' : 'bg-warning text-dark'} mb-3">
                        <i class="bi ${b.status === 'Available' ? 'bi-check-circle-fill' : 'bi-clock-history'}"></i> 
                        ${b.status}
                    </span>
                    <div class="mt-auto d-flex gap-2">
                        ${b.status === 'Available'
                            ? `<button class="btn btn-action btn-outline-success btn-sm flex-fill" onclick="borrowBook(${b.id})"><i class="bi bi-box-arrow-in-right"></i> Borrow</button>`
                            : `<button class="btn btn-action btn-outline-warning btn-sm flex-fill" onclick="returnBook(${b.id})"><i class="bi bi-arrow-counterclockwise"></i> Return</button>`
                        }
                        <button class="btn btn-action btn-outline-danger btn-sm flex-fill" onclick="deleteBook(${b.id})"><i class="bi bi-trash"></i> Delete</button>
                    </div>
                </div>
        </div>
      </div>
    `
  ).join("");
}

loginBtn.addEventListener("click", async (e) => {
  loginBtn.textContent = 'Loading...';
  loginBtn.disabled = true;

  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      currentUser.innerText = `Logged in as: ${username}`;
      loginContainer.classList.add("d-none");
      appContainer.classList.remove("d-none");
      logoutBtn.classList.remove("d-none");
      loadBooks();
    } else {
      alert(data.message || "Login failed");
    }
  } catch (err) {
    alert("Server error");
  } finally {
    loginBtn.textContent = 'Login';
    loginBtn.disabled = false;
  }
});

function getToken() {
  return localStorage.getItem("token");
}

function getUsername() {
  return `Bearer ${localStorage.getItem("username")}`;
}

registerBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  registerBtn.textContent = 'Loading...';
  registerBtn.disabled = true;
  const username = document.getElementById("registerUsername").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });


    const data = await res.json();
    if (res.ok) {
      alert("Registration successful. You can now login.");
      registerForm.reset();
    } else {
      alert(data.message || "Registration failed");
    }
  } catch (err) {
    alert(`Server error ${err}`);
  } finally {
    registerBtn.textContent = 'Register';
    registerBtn.disabled = false;
  }
});

bookForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;
  const isbn = document.getElementById("isbn").value;

  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${API_URL}/books`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, author, isbn }),
    });

    if (res.ok) {
      bookForm.reset();
      const modal = bootstrap.Modal.getInstance(document.getElementById("addBookModal"));
      modal.hide();
      loadBooks();
    } else {
      const data = await res.json();
      alert(data.message || "Failed to add book");
    }
  } catch (err) {
    alert("Server error");
  }
});

async function borrowBook(id) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/books/${id}/borrow`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    },
  });
  if (res.ok) loadBooks();
  else {
   const data = await res.json();
    alert(`Failed to borrow: ${data.message || 'Unknown error'}`);
  } 
}

async function returnBook(id) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/books/${id}/return`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    },
  });
  if (res.ok) loadBooks();
  else {
   const data = await res.json();
    alert(`Failed to return: ${data.message || 'Unknown error'}`);
  } 
}

async function deleteBook(id) {
  
  const confirmed = confirm("Are you sure?");
  if (!confirmed) return;

  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/books/${id}`, {
    method: "DELETE",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    },
  });

  if (res.ok) loadBooks();
  else {
   const data = await res.json();
    alert(`Failed to delete: ${data.message || 'Unknown error'}`);
  } 
}

logoutBtn.addEventListener("click", () => {
  logout();
});

function logout() {
  localStorage.removeItem("token");
  loginContainer.classList.remove("d-none");
  appContainer.classList.add("d-none");
  logoutBtn.classList.add("d-none");
  currentUser.innerText = "";
}
