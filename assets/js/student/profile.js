// ============================================================
//  Sri Kakatiya School Management Platform – student/profile.js
//  Account Profile Details and Photo Upload Controller
// ============================================================

(function () {
  // Default avatar SVG for students
  const DEFAULT_AVATAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzFlMTUyZSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjZmZkZmJhIi8+PHBhdGggZD0iTTIwIDg1IEMyMCA2NSwgODAgNjUsIDgwIDg1IFoiIGZpbGw9IiM0NTg1ODgiLz48cGF0aCBkPSJNMzUgMzAgUTUwIDE1IDY1IDMwIiBzdHJva2U9IiMyODI4MjgiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==";

  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    loadProfileData();

    // Listen to data syncs to update profile
    window.addEventListener('skhs_db_synced', loadProfileData);

    // Profile Details Form Submission
    const form = document.getElementById('profile-details-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('profile-phone').value.trim();
        const name = document.getElementById('profile-name').value.trim();

        const alertContainer = document.getElementById('dashboard-alert-container');
        const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

        const userId = currentUser.userId || currentUser.id;
        const res = await window.skhs_auth.updateProfile(userId, name, phone, null);
        if (res.success) {
          // Also update the student table phone
          const student = window.skhs_db.findOne('students', 'userId', userId);
          if (student) {
            await window.skhs_db.update('students', 'studentId', student.studentId, { phone: phone });
          }
          showAlert('Contact details updated successfully!', 'success');
          loadProfileData();
        } else {
          showAlert(res.message || 'Update failed.', 'error');
        }
      });
    }

    // Photo File Input Change
    const photoInput = document.getElementById('photo-file-input');
    if (photoInput) {
      photoInput.addEventListener('change', async function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const alertContainer = document.getElementById('dashboard-alert-container');
        const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

        if (!window.skhs_security.isAllowedImageFile(file)) {
          showAlert('Choose a PNG, JPG, WebP, or GIF image under 1MB.', 'error');
          e.target.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = async function (evt) {
          const base64Image = evt.target.result;
          const userId = currentUser.userId || currentUser.id;
          const res = await window.skhs_auth.updateProfile(userId, null, null, base64Image);
          if (res.success) {
            showAlert('Profile picture updated successfully!', 'success');
            // Immediately update avatar previews
            const headerAvatar = document.getElementById('header-avatar');
            const previewAvatar = document.getElementById('profile-avatar-preview');
            if (headerAvatar) headerAvatar.src = base64Image;
            if (previewAvatar) previewAvatar.src = base64Image;
            loadProfileData();
          } else {
            showAlert(res.message || 'Photo upload failed.', 'error');
          }
        };
        reader.onerror = () => {
          showAlert('Failed to read image file.', 'error');
        };
        reader.readAsDataURL(file);
      });
    }
  });

  function loadProfileData() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const userId = currentUser.userId || currentUser.id;

    // Find student by userId (camelCase key)
    const student = window.skhs_db.findOne('students', 'userId', userId);

    // Determine avatar to show
    const avatarSrc = (currentUser.profilePhoto && window.skhs_security.isAllowedImageDataUrl(currentUser.profilePhoto))
      ? currentUser.profilePhoto
      : (currentUser.profilePhoto && currentUser.profilePhoto.startsWith('http'))
        ? currentUser.profilePhoto
        : DEFAULT_AVATAR;

    // Update header widget
    const headerFullName = document.getElementById('header-fullname');
    if (headerFullName) headerFullName.textContent = (student && student.fullName) || currentUser.fullName || 'Student';

    const headerAvatar = document.getElementById('header-avatar');
    if (headerAvatar) headerAvatar.src = avatarSrc;

    const previewAvatar = document.getElementById('profile-avatar-preview');
    if (previewAvatar) previewAvatar.src = avatarSrc;

    if (!student) {
      // No student record yet — show minimal profile
      const nameInput = document.getElementById('profile-name');
      if (nameInput) nameInput.value = currentUser.fullName || '';
      const emailInput = document.getElementById('profile-email');
      if (emailInput) emailInput.value = currentUser.email || '';
      return;
    }

    // Form inputs
    const nameInput = document.getElementById('profile-name');
    if (nameInput) nameInput.value = student.fullName || currentUser.fullName || '';

    const emailInput = document.getElementById('profile-email');
    if (emailInput) emailInput.value = student.email || currentUser.email || '';

    const phoneInput = document.getElementById('profile-phone');
    if (phoneInput) phoneInput.value = student.phone || currentUser.mobileNumber || '';

    // Render details and parent grids
    renderDetailsGrid(student);
    renderParentGrid(student);

    // Gauge update
    updateProfileGauge(currentUser, student);
  }

  function renderDetailsGrid(student) {
    const grid = document.getElementById('profile-details-grid');
    if (!grid) return;

    // Find class by classId (camelCase)
    const cls = window.skhs_db.findOne('classes', 'classId', student.classId);

    const items = [
      { label: 'Student ID', value: student.studentId },
      { label: 'Gender', value: student.gender || 'Not specified' },
      { label: 'Date of Birth', value: student.dob || 'Not specified' },
      { label: 'Class & Section', value: cls ? `${cls.name} - ${student.section}` : `${student.classId || ''} - ${student.section || ''}` },
      { label: 'Roll Number', value: student.rollNumber || 'Not assigned' },
      { label: 'Admission Date', value: student.admissionDate || 'N/A' },
      { label: 'Residential Address', value: student.address || 'Not specified' }
    ];

    grid.innerHTML = items.map(item => `
      <div>
        <span style="display: block; font-size: 0.75rem; color: var(--portal-text-muted); font-weight: 500;">${item.label}</span>
        <strong style="font-size: 0.95rem; display: block; margin-top: 0.25rem;">${item.value}</strong>
      </div>
    `).join('');
  }

  function renderParentGrid(student) {
    const grid = document.getElementById('profile-parent-grid');
    if (!grid) return;

    if (!student.parentId) {
      grid.innerHTML = `<p style="grid-column: 1/-1; color: var(--portal-text-muted); font-size: 0.9rem;">No parent record linked. Please contact administration.</p>`;
      return;
    }

    // Find parent by parentId (camelCase)
    const parent = window.skhs_db.findOne('parents', 'parentId', student.parentId);
    if (!parent) {
      grid.innerHTML = `<p style="grid-column: 1/-1; color: var(--portal-text-muted); font-size: 0.9rem;">Parent record (${student.parentId}) not found in database.</p>`;
      return;
    }

    const items = [
      { label: 'Guardian Full Name', value: parent.fullName },
      { label: 'Relationship', value: 'Parent/Guardian' },
      { label: 'Contact Phone', value: parent.mobileNumber || 'N/A' },
      { label: 'Email Address', value: parent.email || 'N/A' },
      { label: 'Occupation', value: parent.occupation || 'N/A' }
    ];

    grid.innerHTML = items.map(item => `
      <div>
        <span style="display: block; font-size: 0.75rem; color: var(--portal-text-muted); font-weight: 500;">${item.label}</span>
        <strong style="font-size: 0.95rem; display: block; margin-top: 0.25rem;">${item.value}</strong>
      </div>
    `).join('');
  }

  function updateProfileGauge(user, student) {
    const checkPhoto = document.getElementById('check-photo');
    const checkContact = document.getElementById('check-contact');
    const checkParent = document.getElementById('check-parent');
    const gaugeText = document.getElementById('profile-gauge-text');
    const circle = document.getElementById('profile-gauge-circle');
    const desc = document.getElementById('profile-gauge-desc');

    if (!checkPhoto || !checkContact || !checkParent) return;

    let score = 0;

    // Photo (33%)
    const hasPhoto = user.profilePhoto && user.profilePhoto.trim() !== '';
    if (hasPhoto) {
      score += 33;
      checkPhoto.className = 'checklist-item done';
      checkPhoto.querySelector('.status-icon').textContent = '✅';
    } else {
      checkPhoto.className = 'checklist-item';
      checkPhoto.querySelector('.status-icon').textContent = '❌';
    }

    // Contact (33%)
    const hasContact = !!(student && student.phone) || !!(user.mobileNumber && user.mobileNumber.trim() !== '');
    if (hasContact) {
      score += 33;
      checkContact.className = 'checklist-item done';
      checkContact.querySelector('.status-icon').textContent = '✅';
    } else {
      checkContact.className = 'checklist-item';
      checkContact.querySelector('.status-icon').textContent = '❌';
    }

    // Parent (34%)
    const hasParent = !!(student && student.parentId);
    if (hasParent) {
      score += 34;
      checkParent.className = 'checklist-item done';
      checkParent.querySelector('.status-icon').textContent = '✅';
    } else {
      checkParent.className = 'checklist-item';
      checkParent.querySelector('.status-icon').textContent = '❌';
    }

    if (gaugeText) gaugeText.textContent = `${score}%`;

    if (circle) {
      const circumference = 195;
      const offset = circumference - (score / 100) * circumference;
      circle.style.strokeDasharray = circumference;
      circle.style.strokeDashoffset = offset;
    }

    if (desc) {
      desc.textContent = score === 100
        ? 'Excellent! Your portal profile has been fully secured and verified.'
        : `Finish the checklist below to complete profile settings (Current: ${score}%).`;
    }
  }
})();
