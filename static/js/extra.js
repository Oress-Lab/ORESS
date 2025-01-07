/*
*/

document.addEventListener('DOMContentLoaded', function() {
    // Login password toggle
    document.getElementById('toggleLoginPassword')?.addEventListener('click', function() {
        const password = document.getElementById('loginPassword');
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });

    // Signup password toggle
    document.getElementById('toggleSignupPassword')?.addEventListener('click', function() {
        const password = document.getElementById('signupPassword');
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });

    // Forgot password toggle
    document.getElementById('toggleForgotPassword')?.addEventListener('click', function() {
        const password = document.getElementById('forgotPassword');
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });

    // Auto update copyright year
    const copyrightYear = document.getElementById('copyright-year');
    if (copyrightYear) {
        copyrightYear.textContent = new Date().getFullYear();
    }
});