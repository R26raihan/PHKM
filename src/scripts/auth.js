// auth.js
document.addEventListener('DOMContentLoaded', () => {
    // Handle Register Form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            if (!name || !email || !password) {
                displayMessage('register-message', 'Semua field harus diisi!', 'error');
                return;
            }

            try {
                const response = await fetch('http://localhost/Algoplay/backend/register.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const result = await response.json();

                if (result.success) {
                    displayMessage('register-message', result.message, 'success');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1000);
                } else {
                    displayMessage('register-message', result.message, 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                displayMessage('register-message', 'Gagal terhubung ke server!', 'error');
            }
        });
    }

    // Handle Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                displayMessage('login-message', 'Email dan password harus diisi!', 'error');
                return;
            }

            try {
                const response = await fetch('http://localhost/Algoplay/backend/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();

                if (result.success) {
                    displayMessage('login-message', result.message, 'success');
                    setTimeout(() => {
                        window.location.href = 'Home.html';
                    }, 1000);
                } else {
                    displayMessage('login-message', result.message, 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                displayMessage('login-message', 'Gagal terhubung ke server!', 'error');
            }
        });
    }

    // Fungsi untuk menampilkan pesan
    function displayMessage(elementId, message, type) {
        const messageElement = document.getElementById(elementId);
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.style.color = type === 'success' ? 'green' : 'red';
            messageElement.style.display = 'block'; // Pastikan elemen terlihat
        } else {
            console.warn(`Elemen dengan ID ${elementId} tidak ditemukan!`);
            alert(message); // Fallback ke alert
        }
    }
});