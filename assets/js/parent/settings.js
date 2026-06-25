// ============================================================
//  Sri Kakatiya School Management Platform – parent/settings.js
//  Parent Settings Panel Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    loadPreferences();
    setupListeners();
  });

  function loadPreferences() {
    const selectTheme = document.getElementById('settings-theme-select');
    const selectLang = document.getElementById('settings-lang-select');

    if (selectTheme) {
      selectTheme.value = localStorage.getItem('portal_theme') || 'light';
    }
    if (selectLang) {
      selectLang.value = localStorage.getItem('parent_lang') || 'en';
    }
  }

  function setupListeners() {
    const saveBtn = document.getElementById('btn-save-settings');
    const alertContainer = document.getElementById('dashboard-alert-container');
    const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const theme = document.getElementById('settings-theme-select').value;
        const lang = document.getElementById('settings-lang-select').value;

        localStorage.setItem('portal_theme', theme);
        localStorage.setItem('parent_lang', lang);

        const htmlEl = document.documentElement;
        const themeToggle = document.getElementById('theme-toggle');
        if (theme === 'dark') {
          htmlEl.classList.add('dark-theme');
          if (themeToggle) themeToggle.textContent = '🌙';
        } else {
          htmlEl.classList.remove('dark-theme');
          if (themeToggle) themeToggle.textContent = '☀️';
        }

        showAlert("System preferences updated successfully!", "success");
      });
    }
  }
})();
