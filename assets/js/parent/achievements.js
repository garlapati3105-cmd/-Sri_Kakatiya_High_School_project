// ============================================================
//  Sri Kakatiya School Management Platform – parent/achievements.js
//  Parent Student Achievements Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    renderAchievements();
    window.addEventListener('skhs_db_synced', renderAchievements);
    window.addEventListener('skhs_parent_child_changed', renderAchievements);
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

  function renderAchievements() {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;

    const childId = getActiveChildId();
    if (!childId) return;

    // Simulated achievements based on childId
    const achievements = [
      { id: 'ach-1', title: 'Academic Excellence Award', category: 'Academic', date: '2026-04-15', description: 'Awarded for securing top ranks in terminal examinations.' },
      { id: 'ach-2', title: '100% Attendance Shield', category: 'Attendance', date: '2026-04-15', description: 'Maintain perfect attendance throughout the academic session.' },
      { id: 'ach-3', title: 'Annual Sports Meet Participation', category: 'Sports', date: '2025-11-15', description: 'Represented class team in the inter-school relay races.' }
    ];

    grid.innerHTML = '';
    achievements.forEach(ach => {
      const card = document.createElement('div');
      card.className = 'portal-card';
      card.innerHTML = `
        <h3 class="card-title" style="margin-bottom:0.25rem;">🏆 ${ach.title}</h3>
        <div style="font-size:0.85rem; font-weight:600; color:var(--portal-accent-dark);">${ach.category} Award</div>
        <div style="font-size:0.8rem; color:var(--portal-text-muted); margin-top:0.25rem;">Date Received: ${ach.date}</div>
        <p style="font-size:0.85rem; margin-top:0.5rem;">${ach.description}</p>
        <button class="btn-portal" style="margin-top:0.75rem; font-size:0.8rem; padding:0.5rem;" onclick="alert('Downloading certificate PDF file...')">Download Certificate</button>
      `;
      grid.appendChild(card);
    });
  }
})();
