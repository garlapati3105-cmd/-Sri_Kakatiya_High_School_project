// ============================================================
//  Sri Kakatiya School Management Platform – student/settings.js
//  Student Preferences and Layout Settings Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Only run if user is student
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    loadSettingsPreferences();

    // Theme & Layout Options Form Submit
    const layoutForm = document.getElementById('settings-layout-form');
    if (layoutForm) {
      layoutForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const theme = document.getElementById('settings-theme').value;
        const density = document.getElementById('settings-layout').value;
        const lang = document.getElementById('settings-lang').value;

        // Apply theme color
        const themeToggle = document.getElementById('theme-toggle');
        const htmlEl = document.documentElement;

        if (theme === 'dark') {
          htmlEl.classList.add('dark-theme');
          if (themeToggle) themeToggle.textContent = '🌙';
          localStorage.setItem('portal_theme', 'dark');
        } else {
          htmlEl.classList.remove('dark-theme');
          if (themeToggle) themeToggle.textContent = '☀️';
          localStorage.setItem('portal_theme', 'light');
        }

        // Apply density
        if (density === 'compact') {
          document.body.classList.add('compact-density');
          localStorage.setItem('portal_density', 'compact');
        } else {
          document.body.classList.remove('compact-density');
          localStorage.setItem('portal_density', 'default');
        }

        // Save lang
        localStorage.setItem('portal_lang', lang);

        const alertContainer = document.getElementById('dashboard-alert-container');
        window.skhs_dom.showAlert(alertContainer, "Interface preferences saved successfully!", "success", 4000);
      });
    }

    // Notifications Form Submit
    const notifForm = document.getElementById('settings-notifications-form');
    if (notifForm) {
      notifForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const academic = document.getElementById('set-ntf-academic').checked;
        const admin = document.getElementById('set-ntf-admin').checked;
        const urgent = document.getElementById('set-ntf-urgent').checked;

        localStorage.setItem('set_ntf_academic', academic ? 'true' : 'false');
        localStorage.setItem('set_ntf_admin', admin ? 'true' : 'false');
        localStorage.setItem('set_ntf_urgent', urgent ? 'true' : 'false');

        const alertContainer = document.getElementById('dashboard-alert-container');
        window.skhs_dom.showAlert(alertContainer, "Notification priorities saved successfully!", "success", 4000);
      });
    }
  });

  function loadSettingsPreferences() {
    // 1. Theme
    const savedTheme = localStorage.getItem('portal_theme') || 'light';
    const themeSelect = document.getElementById('settings-theme');
    if (themeSelect) themeSelect.value = savedTheme;

    // 2. Density
    const savedDensity = localStorage.getItem('portal_density') || 'default';
    const densitySelect = document.getElementById('settings-layout');
    if (densitySelect) densitySelect.value = savedDensity;
    if (savedDensity === 'compact') {
      document.body.classList.add('compact-density');
    }

    // 3. Language
    const savedLang = localStorage.getItem('portal_lang') || 'en';
    const langSelect = document.getElementById('settings-lang');
    if (langSelect) langSelect.value = savedLang;

    // 4. Notifications checkboxes
    const academic = localStorage.getItem('set_ntf_academic') !== 'false';
    const admin = localStorage.getItem('set_ntf_admin') !== 'false';
    const urgent = localStorage.getItem('set_ntf_urgent') !== 'false';

    const checkAcademic = document.getElementById('set-ntf-academic');
    const checkAdmin = document.getElementById('set-ntf-admin');
    const checkUrgent = document.getElementById('set-ntf-urgent');

    if (checkAcademic) checkAcademic.checked = academic;
    if (checkAdmin) checkAdmin.checked = admin;
    if (checkUrgent) checkUrgent.checked = urgent;
  }
})();
