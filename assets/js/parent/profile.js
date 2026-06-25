// ============================================================
//  Sri Kakatiya School Management Platform – parent/profile.js
//  Parent Profile Controller (Child Display Refined)
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    renderProfile();
    setupListeners();

    window.addEventListener('skhs_db_synced', renderProfile);
    window.addEventListener('skhs_parent_child_changed', renderProfile);
  });

  function getActiveChildId() {
    const selector = document.getElementById('parent-child-selector');
    if (selector && selector.value) return selector.value;
    const saved = localStorage.getItem('skhs_parent_active_child');
    if (saved) return saved;
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return null;
    const parent = window.skhs_db.findOne('parents', 'userId', currentUser.userId || currentUser.id);
    if (!parent) return null;
    const linked = Array.isArray(parent.linkedStudents) ? parent.linkedStudents : [];
    return linked[0] || null;
  }

  function renderProfile() {
    const currentUser = window.skhs_auth.getCurrentUser();
    const studentId = getActiveChildId();
    if (!currentUser || !studentId) return;

    const parent = window.skhs_db.findOne('parents', 'userId', currentUser.userId || currentUser.id);
    if (!parent) return;

    // Populate Parent Details inputs
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');

    if (nameInput) nameInput.value = parent.fullName || currentUser.fullName || '';
    if (emailInput) emailInput.value = parent.email || currentUser.email || '';
    if (phoneInput) phoneInput.value = parent.mobileNumber || currentUser.mobileNumber || '';

    const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzFlMTUyZSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjZmZkZmJhIi8+PHBhdGggZD0iTTIwIDg1IEMyMCA2NSwgODAgNjUsIDgwIDg1IFoiIGZpbGw9IiM0NTg1ODgiLz48cGF0aCBkPSJNMzUgMzAgUTUwIDE1IDY1IDMwIiBzdHJva2U9IiMyODI4MjgiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==";
    const avatarSrc = window.skhs_security.isAllowedImageDataUrl(currentUser.profilePhoto)
      ? currentUser.profilePhoto
      : defaultAvatar;
    
    const previewImg = document.getElementById('profile-avatar-preview');
    if (previewImg) previewImg.src = avatarSrc;

    // Child Profile Details
    const student = window.skhs_db.findOne('students', 'studentId', studentId);
    if (!student) return;

    const childGrid = document.getElementById('profile-child-grid');
    if (childGrid) {
      const classRecord = window.skhs_db.findOne('classes', 'classId', student.classId);
      childGrid.innerHTML = `
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Admission Number:</span>
          <strong>${student.studentId}</strong>
        </div>
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Student Name:</span>
          <strong>${student.fullName}</strong>
        </div>
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Class & Section:</span>
          <strong>${classRecord ? classRecord.name : student.classId} - ${student.section || 'A'}</strong>
        </div>
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Roll Number:</span>
          <strong>${student.rollNumber || 'N/A'}</strong>
        </div>
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Date of Birth:</span>
          <strong>${student.dob || 'N/A'}</strong>
        </div>
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Blood Group:</span>
          <strong>${student.bloodGroup || 'B+'}</strong>
        </div>
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Parent Details:</span>
          <strong>${parent.fullName} (${parent.occupation || 'Parent'})</strong>
        </div>
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Emergency Contact Number:</span>
          <strong>${parent.mobileNumber}</strong>
        </div>
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Emergency Address:</span>
          <strong>${student.address || 'N/A'}</strong>
        </div>
      `;
    }

    const childAvatarImg = document.getElementById('profile-child-avatar');
    if (childAvatarImg) {
      childAvatarImg.src = student.profilePhoto || defaultAvatar;
    }
  }

  function setupListeners() {
    const form = document.getElementById('profile-details-form');
    const alertContainer = document.getElementById('dashboard-alert-container');
    const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentUser = window.skhs_auth.getCurrentUser();
        const parent = window.skhs_db.findOne('parents', 'userId', currentUser.userId || currentUser.id);
        if (!parent) return;

        const nameVal = document.getElementById('profile-name').value.trim();
        const phoneVal = document.getElementById('profile-phone').value.trim();

        const authRes = window.skhs_auth.updateProfile(currentUser.userId, nameVal, phoneVal, null);
        if (authRes.success) {
          await window.skhs_db.update('parents', 'parentId', parent.parentId, {
            fullName: nameVal,
            mobileNumber: phoneVal
          });

          showAlert("Parent credentials updated successfully!", "success");
          window.dispatchEvent(new Event('skhs_db_synced'));
        } else {
          showAlert(authRes.message, "error");
        }
      });
    }

    const fileInput = document.getElementById('photo-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.skhs_security.isAllowedImageFile(file)) {
          showAlert("Choose a PNG, JPG, WebP, or GIF image under 1MB.", "error");
          e.target.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = async function (evt) {
          const base64Image = evt.target.result;
          const currentUser = window.skhs_auth.getCurrentUser();
          const res = window.skhs_auth.updateProfile(currentUser.userId, null, null, base64Image);
          if (res.success) {
            showAlert("Profile photo updated successfully!", "success");
            window.dispatchEvent(new Event('skhs_db_synced'));
          } else {
            showAlert(res.message, "error");
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }
})();
