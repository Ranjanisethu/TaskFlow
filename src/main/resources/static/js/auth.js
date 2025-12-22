/* Notification Logic */
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'glass-panel';
    div.style.padding = '1rem';
    div.style.minWidth = '250px';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '0.75rem';
    div.style.borderLeft = type === 'error' ? '4px solid #ef4444' : '4px solid #10b981';
    div.style.background = '#1e293b';
    div.style.color = 'white';
    div.style.animation = 'fadeIn 0.3s ease';
    div.style.margin = '0 auto'; /* Center horizontally if container allows */

    // Simple icon replacement since we might not have boxicons loaded yet or reliably
    const icon = type === 'error' ? "❌" : "✅";

    div.innerHTML = `
        <div style="font-size:1.2rem;">${icon}</div>
        <div style="font-size:0.9rem;">${message}</div>
    `;

    container.appendChild(div);

    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateX(100%)';
        div.style.transition = 'all 0.3s ease';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

function toggleAuth() {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');

    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
        document.title = 'TaskFlow - Login';
    } else {
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        document.title = 'TaskFlow - Register';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            showNotification('Login successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = '/dashboard.html', 1000);
        } else {
            showNotification('Login failed: Invalid credentials', 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('An error occurred. check console.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const company = document.getElementById('reg-company').value;
    const password = document.getElementById('reg-password').value;

    // PASSWORD VALIDATION
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
        showNotification('Password must be 8+ chars, have number & symbol.', 'error');
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email, company })
        });

        if (response.ok) {
            showNotification('Registration successful! Please login.', 'success');
            toggleAuth();
        } else {
            const msg = await response.text();
            showNotification('Registration failed: ' + msg, 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification('An error occurred', 'error');
    }
}

function toggleForgot() {
    const loginForm = document.getElementById('login-form');
    const forgotForm = document.getElementById('forgot-form');

    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        forgotForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        forgotForm.style.display = 'block';
    }
}

async function handleForgot(event) {
    event.preventDefault();
    const email = document.getElementById('forgot-email').value;

    try {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (response.ok) {
            showNotification('Reset email sent. Check your inbox.', 'success');
            setTimeout(() => toggleForgot(), 2000); // Go back to login
        } else {
            const msg = await response.text();
            showNotification('Error: ' + msg, 'error');
        }
    } catch (error) {
        showNotification('Failed to send request', 'error');
    }
}
