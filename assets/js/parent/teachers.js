// ============================================================
//  Sri Kakatiya School Management Platform – parent/teachers.js
//  Parent Teacher Directory Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    renderDirectory();
    window.addEventListener('skhs_db_synced', renderDirectory);
    window.addEventListener('skhs_parent_child_changed', renderDirectory);
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

  function renderDirectory() {
    const grid = document.getElementById('teachers-directory-grid');
    if (!grid) return;

    const childId = getActiveChildId();
    if (!childId) return;

    const student = window.skhs_db.findOne('students', 'studentId', childId);
    if (!student) return;

    const subjects = window.skhs_db.find('subjects', 'classId', student.classId);
    if (subjects.length === 0) {
      grid.innerHTML = `<p style="text-align: center; color: var(--portal-text-muted);">No assigned teachers found for this class.</p>`;
      return;
    }

    grid.innerHTML = '';
    subjects.forEach(s => {
      const teacher = window.skhs_db.findOne('teachers', 'teacherId', s.teacherId);
      if (teacher) {
        const card = document.createElement('div');
        card.className = 'portal-card';
        card.style = `
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        `;
        card.innerHTML = `
          <h3 class="card-title" style="margin-bottom:0.25rem;">👨‍🏫 ${teacher.fullName}</h3>
          <div style="font-size:0.85rem; font-weight:600; color:var(--portal-primary-light);">${s.name} Teacher</div>
          <div style="font-size:0.8rem; color:var(--portal-text-muted); margin-top:0.25rem;">
            <div><strong>Department:</strong> ${teacher.qualification || 'Academic'}</div>
            <div><strong>Experience:</strong> ${teacher.experience || 'N/A'}</div>
            <div><strong>Email:</strong> ${teacher.email || 'contact@srikakatiya.com'}</div>
          </div>
          <button class="btn-portal" style="margin-top:0.75rem; font-size:0.8rem; padding:0.5rem;" onclick="contactTeacherFromDirectory('${teacher.teacherId}')">💬 Contact School</button>
        `;
        grid.appendChild(card);
      }
    });
  }

  window.contactTeacherFromDirectory = function (teacherId) {
    window.switchTab('communication');
    setTimeout(() => {
      const select = document.getElementById('msg-recipient');
      if (select) {
        select.value = teacherId;
      }
    }, 100);
  };
})();
