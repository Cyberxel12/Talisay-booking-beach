/**
 * Talisay Beach Resort - Authentication & Account Management
 */

document.addEventListener('DOMContentLoaded', () => {
  initRoleToggle();
  initPasswordVisibility();
  initTermsModal();
  initLoginForm();
  initRegisterForm();
  initForgotForm();
  checkRegistrationNotice();
});

function checkRegistrationNotice() {
  if (sessionStorage.getItem('just_registered')) {
    sessionStorage.removeItem('just_registered');
    setTimeout(() => {
      showToast('Registration complete! Please enter your username and password to log in.', 'success');
    }, 300);
  }
}

// 1. Role Toggle (User / Admin) on index.html
function initRoleToggle() {
  const userBtn = document.getElementById('roleBtnUser');
  const adminBtn = document.getElementById('roleBtnAdmin');
  const roleInput = document.getElementById('selectedRole');

  if (!userBtn || !adminBtn) return;

  userBtn.addEventListener('click', () => {
    userBtn.classList.add('active');
    adminBtn.classList.remove('active');
    if (roleInput) roleInput.value = 'user';
  });

  adminBtn.addEventListener('click', () => {
    adminBtn.classList.add('active');
    userBtn.classList.remove('active');
    if (roleInput) roleInput.value = 'admin';
  });
}

// 2. Password Visibility Toggle
function initPasswordVisibility() {
  const toggleBtns = document.querySelectorAll('.toggle-password');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.classList.remove('fa-eye');
          btn.classList.add('fa-eye-slash');
        } else {
          input.type = 'password';
          btn.classList.remove('fa-eye-slash');
          btn.classList.add('fa-eye');
        }
      }
    });
  });
}

// 3. Terms & Conditions Modal
function initTermsModal() {
  const termsLink = document.getElementById('openTermsModal');
  const termsModal = document.getElementById('termsModal');
  const closeBtn = document.getElementById('closeTermsBtn');
  const agreeBtn = document.getElementById('agreeTermsBtn');
  const termsCheckbox = document.getElementById('agreeTermsCheckbox');

  if (termsLink && termsModal) {
    termsLink.addEventListener('click', (e) => {
      e.preventDefault();
      termsModal.classList.add('active');
    });
  }

  if (closeBtn && termsModal) {
    closeBtn.addEventListener('click', () => {
      termsModal.classList.remove('active');
    });
  }

  if (agreeBtn && termsModal) {
    agreeBtn.addEventListener('click', () => {
      if (termsCheckbox) {
        termsCheckbox.checked = true;
      }
      termsModal.classList.remove('active');
      showToast('You agreed to the Terms & Conditions', 'success');
    });
  }

  // Close when clicking overlay backdrop
  if (termsModal) {
    termsModal.addEventListener('click', (e) => {
      if (e.target === termsModal) {
        termsModal.classList.remove('active');
      }
    });
  }
}

// 4. Login Submission
function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const role = document.getElementById('selectedRole') ? document.getElementById('selectedRole').value : 'user';

    if (!username || !password) {
      showToast('Please enter both username and password.', 'warning');
      return;
    }

    const user = TalisayDB.findUser(username, role);

    if (user && user.password === password) {
      if (user.status === 'Banned') {
        showToast('Your account has been deactivated. Please contact administrator.', 'danger');
        return;
      }
      TalisayDB.setCurrentUser(user);
      showToast(`Welcome back, ${user.name}!`, 'success');
      setTimeout(() => {
        if (user.role === 'admin') {
          window.location.href = 'admin-dashboard.html';
        } else {
          window.location.href = 'home.html';
        }
      }, 700);
    } else {
      if (role === 'admin') {
        // Admin credentials fallback check
        if (username === 'admin' && password === 'admin123') {
          const adminUser = { name: 'Admin Manager', username: 'admin', role: 'admin', email: 'admin@talisaybeach.com' };
          TalisayDB.setCurrentUser(adminUser);
          showToast('Welcome back, Admin Manager!', 'success');
          setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
          }, 700);
        } else {
          showToast('Invalid admin credentials. Please enter valid admin username and password.', 'danger');
        }
      } else {
        showToast('Invalid username or password. If you do not have an account yet, please click "REGISTER HERE".', 'danger');
      }
    }
  });
}

// 5. Register Submission
function initRegisterForm() {
  const regForm = document.getElementById('registerForm');
  if (!regForm) return;

  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fullName = document.getElementById('regFullName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phoneInput = document.getElementById('regPhone');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const agreeTerms = document.getElementById('agreeTermsCheckbox').checked;

    if (!fullName || !email || !phone || !username || !password) {
      showToast('Please fill in all fields including phone number.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'danger');
      return;
    }

    if (!agreeTerms) {
      showToast('Please accept the Terms and Conditions to register.', 'warning');
      return;
    }

    // Check existing
    const existing = TalisayDB.findUser(username);
    if (existing) {
      showToast('Username is already taken. Please choose another.', 'warning');
      return;
    }

    const newUser = TalisayDB.addUser({
      name: fullName,
      email: email,
      phone: phone,
      username: username,
      password: password,
      role: 'user'
    });

    // Save flag for login page notification
    sessionStorage.setItem('just_registered', 'true');
    showToast('Account created successfully! Redirecting to login page...', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);
  });
}

// 6. Forgot Password Submission
function initForgotForm() {
  const forgotForm = document.getElementById('forgotForm');
  const inputField = document.getElementById('forgotInput');

  if (forgotForm && inputField) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = inputField.value.trim();
      if (!email) {
        showToast('Please enter your registered email address.', 'warning');
        return;
      }
      showToast(`Password reset instructions sent to ${email}!`, 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    });
  }
}

// Toast helper
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-success' : type === 'danger' ? 'fa-circle-exclamation text-danger' : 'fa-circle-info text-primary'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

window.showToast = showToast;
