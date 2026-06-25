// ============================================================
//  Sri Kakatiya School Management Platform – teacher/settings.js
//  Teacher Settings Panel Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'teacher') return;

    loadPreferences();
    setupListeners();
  });

  function loadPreferences() {
    const selectTheme = document.getElementById('settings-theme-select');
    const selectLayout = document.getElementById('settings-layout-select');
    const selectLang = document.getElementById('settings-lang-select');

    if (selectTheme) {
      selectTheme.value = localStorage.getItem('portal_theme') || 'light';
    }
    if (selectLayout) {
      selectLayout.value = localStorage.getItem('teacher_layout') || 'standard';
    }
    if (selectLang) {
      selectLang.value = localStorage.getItem('teacher_lang') || 'en';
    }
  }

  function setupListeners() {
    const saveBtn = document.getElementById('btn-save-settings');
    const alertContainer = document.getElementById('dashboard-alert-container');
    const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const theme = document.getElementById('settings-theme-select').value;
        const layout = document.getElementById('settings-layout-select').value;
        const lang = document.getElementById('settings-lang-select').value;

        localStorage.setItem('portal_theme', theme);
        localStorage.setItem('teacher_layout', layout);
        localStorage.setItem('teacher_lang', lang);

        // Apply theme immediately
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
