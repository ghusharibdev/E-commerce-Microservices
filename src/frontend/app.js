const API_GATEWAY = window.location.origin;
const USER_SVC = 'http://localhost:3001';
const PRODUCT_SVC = 'http://localhost:3002';
const ORDER_SVC = 'http://localhost:3003';

// Helper to get auth token
function getToken() {
    return localStorage.getItem('token');
} 

// Update UI based on login state
function updateAuthUI() {
    const token = getToken();
    const authStatusDiv = document.getElementById('auth-status');
    const orderSection = document.getElementById('order-section');
    if (token) {
        authStatusDiv.textContent = '✅ Logged in';
        authStatusDiv.style.background = '#27ae60';
        orderSection.classList.remove('hidden');
        loadProducts(); // refresh products if needed
    } else {
        authStatusDiv.textContent = '❌ Not logged in';
        authStatusDiv.style.background = '#e74c3c';
        orderSection.classList.add('hidden');
    }
}

// Register
async function register() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    if (!username || !password) {
        alert('Please enter username and password');
        return;
    }
    try {
        const res = await fetch(`${USER_SVC}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Registration successful! Please login.');
        } else {
            alert('Registration failed: ' + data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Cannot reach user service');
    }
}

// Login
async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    if (!username || !password) {
        alert('Please enter username and password');
        return;
    }
    try {
        const res = await fetch(`${USER_SVC}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            updateAuthUI();
            alert('Login successful');
        } else {
            alert('Login failed: ' + data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Cannot reach user service');
    }
}

// Load products from Product Service
async function loadProducts() {
    const productsDiv = document.getElementById('products-list');
    productsDiv.innerHTML = '<p>Loading products...</p>';
    try {
        const res = await fetch(`${PRODUCT_SVC}/products`);
        if (!res.ok) throw new Error('Failed to fetch');
        const products = await res.json();
        if (products.length === 0) {
            productsDiv.innerHTML = '<p>No products available.</p>';
            return;
        }
        // Populate products grid
        productsDiv.innerHTML = '';
        products.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <h3>${prod.name}</h3>
                <p>${prod.description || ''}</p>
                <p><strong>Price:</strong> $${prod.price}</p>
                <p><strong>Stock:</strong> ${prod.stock}</p>
            `;
            productsDiv.appendChild(card);
        });
        // Also populate the order dropdown
        const select = document.getElementById('product-select');
        select.innerHTML = '';
        products.forEach(prod => {
            const option = document.createElement('option');
            option.value = prod.id;
            option.textContent = `${prod.name} - $${prod.price}`;
            select.appendChild(option);
        });
    } catch (err) {
        console.error(err);
        productsDiv.innerHTML = '<p class="error">Error loading products. Make sure Product Service is running.</p>';
    }
}

// Place order
async function placeOrder() {
    const token = getToken();
    if (!token) {
        alert('Please login first');
        return;
    }
    const productId = document.getElementById('product-select').value;
    const quantity = document.getElementById('quantity').value;
    if (!productId) {
        alert('Select a product');
        return;
    }
    const orderMsgDiv = document.getElementById('order-message');
    orderMsgDiv.innerHTML = 'Processing...';
    try {
        const res = await fetch(`${ORDER_SVC}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity: parseInt(quantity) })
        });
        const data = await res.json();
        if (res.ok) {
            orderMsgDiv.innerHTML = `<div class="success">✅ Order placed! Order ID: ${data.orderId}</div>`;
        } else {
            orderMsgDiv.innerHTML = `<div class="error">❌ Order failed: ${data.message}</div>`;
        }
    } catch (err) {
        orderMsgDiv.innerHTML = `<div class="error">Error: Cannot reach order service</div>`;
    }
}

// Event listeners after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    loadProducts();

    document.getElementById('login-btn').addEventListener('click', login);
    document.getElementById('register-btn').addEventListener('click', register);
    document.getElementById('order-btn').addEventListener('click', placeOrder);
});