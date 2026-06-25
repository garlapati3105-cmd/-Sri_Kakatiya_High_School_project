// ============================================================
//  Sri Kakatiya School Management Platform – teacher/profile.js
//  Teacher Profile Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'teacher') return;

    renderProfile();
    setupProfileListeners();

    window.addEventListener('skhs_db_synced', renderProfile);
  });

  function renderProfile() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const teacher = window.skhs_db.findOne('teachers', 'userId', currentUser.userId || currentUser.id);
    if (!teacher) return;

    // Display fields
    const detailsGrid = document.getElementById('profile-details-grid');
    if (detailsGrid) {
      detailsGrid.innerHTML = `
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Employee ID:</span>
          <strong>${teacher.teacherId}</strong>
        </div>
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Department/Qualification:</span>
          <strong>${teacher.qualification || 'N/A'}</strong>
        </div>
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Experience:</span>
          <strong>${teacher.experience || 'N/A'}</strong>
        </div>
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Main Subject:</span>
          <strong>${teacher.subject || 'N/A'}</strong>
        </div>
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Assigned Classes:</span>
          <strong>${(Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : []).join(', ') || 'None'}</strong>
        </div>
        <div>
          <span style="opacity: 0.75; font-size: 0.8rem; display: block; margin-bottom: 0.25rem;">Joining Date / Status:</span>
          <strong>${teacher.status || 'Active'}</strong>
        </div>
      `;
    }

    // Populate form
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    const addressInput = document.getElementById('profile-address');

    if (nameInput) nameInput.value = teacher.fullName || currentUser.fullName || '';
    if (emailInput) emailInput.value = teacher.email || currentUser.email || '';
    if (phoneInput) phoneInput.value = teacher.phone || currentUser.mobileNumber || '';
    if (addressInput) addressInput.value = teacher.address || '';

    // Preview photo
    const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iIzFlMTUyZSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSIjZmZkZmJhIi8+PHBhdGggZD0iTTIwIDg1IEMyMCA2NSwgODAgNjUsIDgwIDg1IFoiIGZpbGw9IiM0NTg1ODgiLz48cGF0aCBkPSJNMzUgMzAgQzUwIDE1IDY1IDMwIiBzdHJva2U9IiMyODI4MjgiIHN0cm9rZS13aWR0aD0iOCIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==";
    const avatarSrc = window.skhs_security.isAllowedImageDataUrl(currentUser.profilePhoto)
      ? currentUser.profilePhoto
      : defaultAvatar;
    
    const previewImg = document.getElementById('profile-avatar-preview');
    if (previewImg) previewImg.src = avatarSrc;
  }

  function setupProfileListeners() {
    const form = document.getElementById('profile-details-form');
    const alertContainer = document.getElementById('dashboard-alert-container');
    const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentUser = window.skhs_auth.getCurrentUser();
        const teacher = window.skhs_db.findOne('teachers', 'userId', currentUser.userId || currentUser.id);
        if (!teacher) return;

        const nameVal = document.getElementById('profile-name').value.trim();
        const phoneVal = document.getElementById('profile-phone').value.trim();
        const addressVal = document.getElementById('profile-address').value.trim();

        // 1. Update auth profile
        const authRes = window.skhs_auth.updateProfile(currentUser.userId, nameVal, phoneVal, null);
        if (authRes.success) {
          // 2. Update teachers collection
          await window.skhs_db.update('teachers', 'teacherId', teacher.teacherId, {
            fullName: nameVal,
            phone: phoneVal,
            address: addressVal
          });

          showAlert("Profile updated successfully!", "success");
          window.dispatchEvent(new Event('skhs_db_synced'));
        } else {
          showAlert(authRes.message, "error");
        }
      });
    }

    // File input change
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
            showAlert("Profile picture updated successfully!", "success");
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
