/**
 * Talisay Beach Resort - Common App Interactions, User Profile Modal & Gallery Lightbox
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initUserLogout();
  initUserProfile();
  initGallery();
  initContactForm();
});

// Mobile Navigation
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });
  }
}

// Custom User Confirmation Modal (Replaces browser "localhost says" popup)
function showUserConfirm({
  title = 'Log Out',
  message = 'Are you sure you want to log out of your account?',
  confirmText = 'Log Out',
  cancelText = 'Cancel',
  type = 'danger',
  icon = 'fa-solid fa-arrow-right-from-bracket',
  onConfirm = null,
  onCancel = null
}) {
  let modalOverlay = document.getElementById('userConfirmModal');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'userConfirmModal';
    modalOverlay.className = 'user-confirm-overlay';
    modalOverlay.innerHTML = `
      <div class="user-confirm-box">
        <div class="user-confirm-icon-circle" id="userConfirmIcon">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
        </div>
        <h3 class="user-confirm-title" id="userConfirmTitle">Log Out</h3>
        <div class="user-confirm-message" id="userConfirmMessage">Are you sure you want to log out?</div>
        <div class="user-confirm-actions">
          <button type="button" class="user-confirm-btn-cancel" id="userConfirmCancelBtn">Cancel</button>
          <button type="button" class="user-confirm-btn-action" id="userConfirmOkBtn">Log Out</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);
  }

  const iconCircle = modalOverlay.querySelector('#userConfirmIcon');
  const titleEl = modalOverlay.querySelector('#userConfirmTitle');
  const msgEl = modalOverlay.querySelector('#userConfirmMessage');
  const cancelBtn = modalOverlay.querySelector('#userConfirmCancelBtn');
  const okBtn = modalOverlay.querySelector('#userConfirmOkBtn');

  iconCircle.className = `user-confirm-icon-circle ${type || 'danger'}`;
  iconCircle.innerHTML = `<i class="${icon}"></i>`;
  titleEl.textContent = title;
  msgEl.innerHTML = message;
  cancelBtn.textContent = cancelText;
  if (!cancelText) {
    cancelBtn.style.display = 'none';
    okBtn.style.width = '100%';
  } else {
    cancelBtn.style.display = 'block';
    okBtn.style.width = 'auto';
  }
  okBtn.className = `user-confirm-btn-action ${type || 'danger'}`;
  okBtn.style.display = 'inline-flex';
  okBtn.textContent = confirmText;

  function closeModal() {
    modalOverlay.classList.remove('active');
    cancelBtn.onclick = null;
    okBtn.onclick = null;
  }

  cancelBtn.onclick = () => {
    closeModal();
    if (onCancel) onCancel();
  };

  okBtn.onclick = () => {
    closeModal();
    if (onConfirm) onConfirm();
  };

  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) {
      closeModal();
      if (onCancel) onCancel();
    }
  };

  modalOverlay.classList.add('active');
}

window.showUserConfirm = showUserConfirm;


// User Logout in top nav
function initUserLogout() {
  const logoutBtns = document.querySelectorAll('.btn-nav-logout');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showUserConfirm({
        title: 'Sign Out Confirmation',
        message: 'Are you sure you want to log out of your account?',
        confirmText: 'Yes, Log Out',
        cancelText: 'Stay Logged In',
        onConfirm: () => {
          TalisayDB.logout();
        }
      });
    });
  });
}

// =========================================================
// USER PROFILE MODAL & CHANGE PASSWORD FEATURE
// =========================================================
function initUserProfile() {
  // Ensure profile modal HTML is present in document body
  let profileModal = document.getElementById('userProfileModal');
  if (!profileModal) {
    profileModal = document.createElement('div');
    profileModal.className = 'modal-overlay';
    profileModal.id = 'userProfileModal';
    profileModal.innerHTML = `
      <div class="profile-modal-card">
        <!-- Header Banner -->
        <div class="profile-modal-header">
          <button type="button" class="profile-modal-close" id="closeProfileModalBtn" title="Close Profile">&times;</button>
          <div class="profile-avatar-wrapper">
            <div class="profile-avatar-circle" id="profileAvatarInitial">
              <i class="fa-solid fa-user"></i>
            </div>
          </div>
          <h3 id="profileModalName" class="profile-name">Guest User</h3>
          <div id="profileModalEmail" class="profile-email">guest@talisaybeach.com</div>
          <div class="profile-badge-wrapper">
            <span id="profileModalRole" class="profile-role-badge">
              <i class="fa-solid fa-shield-halved"></i> Registered User
            </span>
          </div>
        </div>

        <!-- Tab Buttons -->
        <div class="profile-tabs">
          <button type="button" class="profile-tab-btn active" id="tabBtnProfileInfo">
            <i class="fa-solid fa-id-card"></i> Account Info
          </button>
          <button type="button" class="profile-tab-btn" id="tabBtnChangePassword">
            <i class="fa-solid fa-key"></i> Change Password
          </button>
        </div>

        <!-- Tab Content 1: Account Info -->
        <div class="profile-tab-pane active" id="profileInfoPane">
          <div class="profile-info-grid">
            <div class="profile-field-item full-width">
              <span class="field-label"><i class="fa-solid fa-user"></i> Full Name</span>
              <span class="field-value" id="profileFieldFullName">Dona Laurito</span>
            </div>
            <div class="profile-field-item">
              <span class="field-label"><i class="fa-solid fa-at"></i> Username</span>
              <span class="field-value" id="profileFieldUsername">@donalaurito</span>
            </div>
            <div class="profile-field-item">
              <span class="field-label"><i class="fa-solid fa-envelope"></i> Email</span>
              <span class="field-value" id="profileFieldEmail">dona@example.com</span>
            </div>
            <div class="profile-field-item">
              <span class="field-label"><i class="fa-solid fa-phone"></i> Phone Number</span>
              <span class="field-value" id="profileFieldPhone">09979051718</span>
            </div>
            <div class="profile-field-item">
              <span class="field-label"><i class="fa-solid fa-circle-check"></i> Account Status</span>
              <span class="field-value" style="color: #16a34a; font-weight: 700;">● Active</span>
            </div>
          </div>
        </div>

        <!-- Tab Content 2: Change Password -->
        <div class="profile-tab-pane" id="changePasswordPane">
          <form id="changePasswordForm">
            <div id="passwordAlertBox" class="profile-alert" style="display: none;"></div>

            <div class="profile-form-group">
              <label class="profile-input-label">Current Password</label>
              <div class="profile-input-wrapper">
                <i class="fa-solid fa-lock profile-input-icon"></i>
                <input type="password" id="inputCurrentPassword" placeholder="Enter current password" required autocomplete="current-password">
                <button type="button" class="btn-pwd-toggle" data-target="inputCurrentPassword" title="Show/Hide Password">
                  <i class="fa-regular fa-eye"></i>
                </button>
              </div>
            </div>

            <div class="profile-form-group">
              <label class="profile-input-label">New Password</label>
              <div class="profile-input-wrapper">
                <i class="fa-solid fa-key profile-input-icon"></i>
                <input type="password" id="inputNewPassword" placeholder="Minimum 6 characters" required minlength="6" autocomplete="new-password">
                <button type="button" class="btn-pwd-toggle" data-target="inputNewPassword" title="Show/Hide Password">
                  <i class="fa-regular fa-eye"></i>
                </button>
              </div>
            </div>

            <div class="profile-form-group">
              <label class="profile-input-label">Confirm New Password</label>
              <div class="profile-input-wrapper">
                <i class="fa-solid fa-check-double profile-input-icon"></i>
                <input type="password" id="inputConfirmPassword" placeholder="Re-type new password" required minlength="6" autocomplete="new-password">
                <button type="button" class="btn-pwd-toggle" data-target="inputConfirmPassword" title="Show/Hide Password">
                  <i class="fa-regular fa-eye"></i>
                </button>
              </div>
            </div>

            <button type="submit" class="btn-profile-submit" id="savePasswordBtn">
              <i class="fa-solid fa-shield-halved"></i> Update Password
            </button>
          </form>
        </div>

        <!-- Modal Footer -->
        <div class="profile-modal-footer">
          <button type="button" class="btn-profile-logout" id="profileLogoutBtn">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Log Out
          </button>
          <button type="button" class="btn-profile-done" id="profileDoneBtn">
            Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(profileModal);
  }

  // Elements
  const closeBtn = document.getElementById('closeProfileModalBtn');
  const doneBtn = document.getElementById('profileDoneBtn');
  const logoutBtn = document.getElementById('profileLogoutBtn');
  const tabInfoBtn = document.getElementById('tabBtnProfileInfo');
  const tabPwdBtn = document.getElementById('tabBtnChangePassword');
  const infoPane = document.getElementById('profileInfoPane');
  const pwdPane = document.getElementById('changePasswordPane');
  const pwdForm = document.getElementById('changePasswordForm');
  const alertBox = document.getElementById('passwordAlertBox');

  // Tab Switching
  if (tabInfoBtn && tabPwdBtn && infoPane && pwdPane) {
    tabInfoBtn.addEventListener('click', () => {
      tabInfoBtn.classList.add('active');
      tabPwdBtn.classList.remove('active');
      infoPane.classList.add('active');
      pwdPane.classList.remove('active');
      if (alertBox) alertBox.style.display = 'none';
    });

    tabPwdBtn.addEventListener('click', () => {
      tabPwdBtn.classList.add('active');
      tabInfoBtn.classList.remove('active');
      pwdPane.classList.add('active');
      infoPane.classList.remove('active');
      if (alertBox) alertBox.style.display = 'none';
    });
  }

  // Password visibility eye toggles
  const toggleBtns = profileModal.querySelectorAll('.btn-pwd-toggle');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
          }
        } else {
          input.type = 'password';
          if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
          }
        }
      }
    });
  });

  // Open Profile Modal and populate with current user
  function openUserProfile() {
    const user = TalisayDB.getCurrentUser();

    // Populate header info
    const nameEl = document.getElementById('profileModalName');
    const emailEl = document.getElementById('profileModalEmail');
    const roleEl = document.getElementById('profileModalRole');
    const avatarInitial = document.getElementById('profileAvatarInitial');

    const fullName = user.name && user.name !== 'Guest' ? user.name : (user.username || 'Registered Guest');
    if (nameEl) nameEl.textContent = fullName;
    if (emailEl) emailEl.textContent = user.email || 'No email registered';
    if (roleEl) {
      roleEl.innerHTML = `<i class="fa-solid fa-shield-halved"></i> ${user.role === 'admin' ? 'Administrator' : 'Registered User'}`;
    }
    if (avatarInitial) {
      const initial = fullName.charAt(0).toUpperCase();
      avatarInitial.textContent = initial || 'U';
    }

    // Populate detail fields
    const fieldFullName = document.getElementById('profileFieldFullName');
    const fieldUsername = document.getElementById('profileFieldUsername');
    const fieldEmail = document.getElementById('profileFieldEmail');
    const fieldPhone = document.getElementById('profileFieldPhone');

    if (fieldFullName) fieldFullName.textContent = user.name || 'Registered Guest';
    if (fieldUsername) fieldUsername.textContent = '@' + (user.username || 'guest');
    if (fieldEmail) fieldEmail.textContent = user.email || 'guest@talisaybeach.com';
    if (fieldPhone) fieldPhone.textContent = user.phone || '09979051718';

    // Reset password tab & form
    if (pwdForm) pwdForm.reset();
    if (alertBox) alertBox.style.display = 'none';

    // Switch to info tab by default
    if (tabInfoBtn) tabInfoBtn.click();

    // Show modal
    profileModal.classList.add('active');
  }

  // Bind avatar buttons
  const avatarBtns = document.querySelectorAll('.user-avatar-btn');
  avatarBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openUserProfile();
    });
  });

  // Close handlers
  if (closeBtn) {
    closeBtn.addEventListener('click', () => profileModal.classList.remove('active'));
  }
  if (doneBtn) {
    doneBtn.addEventListener('click', () => profileModal.classList.remove('active'));
  }
  profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
      profileModal.classList.remove('active');
    }
  });

  // Logout from profile modal
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      profileModal.classList.remove('active');
      showUserConfirm({
        title: 'Sign Out Confirmation',
        message: 'Are you sure you want to log out of your account?',
        confirmText: 'Yes, Log Out',
        cancelText: 'Stay Logged In',
        onConfirm: () => {
          TalisayDB.logout();
        }
      });
    });
  }

  // Handle Change Password Form Submission
  if (pwdForm) {
    pwdForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currPwd = document.getElementById('inputCurrentPassword')?.value || '';
      const newPwd = document.getElementById('inputNewPassword')?.value || '';
      const confirmPwd = document.getElementById('inputConfirmPassword')?.value || '';

      if (newPwd.length < 6) {
        showPasswordAlert('New password must be at least 6 characters long.', 'error');
        return;
      }

      if (newPwd !== confirmPwd) {
        showPasswordAlert('New passwords do not match. Please re-type.', 'error');
        return;
      }

      const currentUser = TalisayDB.getCurrentUser();
      const identifier = currentUser.id || currentUser.username || currentUser.email;

      const result = TalisayDB.changePassword(identifier, currPwd, newPwd);

      if (result.success) {
        showPasswordAlert('✓ Password updated successfully! Your new password is now active.', 'success');
        pwdForm.reset();
      } else {
        showPasswordAlert(result.message || 'Failed to update password.', 'error');
      }
    });
  }

  function showPasswordAlert(msg, type) {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = 'profile-alert ' + type;
    alertBox.style.display = 'flex';
  }
}

// Gallery Filtering and Lightbox
function initGallery() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxClose = document.getElementById('lightboxClose');

  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filterCategory = btn.getAttribute('data-category');

        galleryItems.forEach(item => {
          const itemCat = item.getAttribute('data-category');
          if (filterCategory === 'all' || itemCat === filterCategory) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }

  // Lightbox click
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const caption = item.querySelector('.gallery-caption');
      if (lightboxModal && lightboxImg && img) {
        lightboxImg.src = img.src;
        if (lightboxTitle && caption) {
          lightboxTitle.textContent = caption.textContent;
        }
        lightboxModal.classList.add('active');
      }
    });
  });

  if (lightboxClose && lightboxModal) {
    lightboxClose.addEventListener('click', () => {
      lightboxModal.classList.remove('active');
    });
  }

  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        lightboxModal.classList.remove('active');
      }
    });
  }
}

// Contact Form
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName')?.value;
      showUserConfirm({
        title: 'Message Sent!',
        message: `Thank you <strong>${name || 'Guest'}</strong>! Your message has been sent to Talisay Beach Resort. We will contact you soon.`,
        confirmText: 'Great',
        cancelText: null,
        type: 'primary',
        icon: 'fa-solid fa-paper-plane'
      });
      contactForm.reset();
    });
  }
}
