// ============================================================
//  Sri Kakatiya School Management Platform – parent/timetable.js
//  Parent Student Timetable Grid Controller (Refined)
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    renderTimetable();
    window.addEventListener('skhs_db_synced', renderTimetable);
    window.addEventListener('skhs_parent_child_changed', renderTimetable);
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

  function renderTimetable() {
    const studentId = getActiveChildId();
    if (!studentId) return;

    const student = window.skhs_db.findOne('students', 'studentId', studentId);
    if (!student) return;

    const gridBody = document.getElementById('timetable-grid-body');
    if (!gridBody) return;

    const subjects = window.skhs_db.find('subjects', 'classId', student.classId);
    if (subjects.length === 0) {
      gridBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--portal-text-muted);">No timetable records set for this class.</td></tr>`;
      return;
    }

    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    gridBody.innerHTML = '';
    weekdays.forEach(day => {
      const row = document.createElement('tr');
      let cellsHtml = `<td><strong>${day}</strong></td>`;
      for (let period = 1; period <= 6; period++) {
        const sub = subjects[(period + day.length) % subjects.length];
        const teacher = window.skhs_db.findOne('teachers', 'teacherId', sub.teacherId);
        cellsHtml += `
          <td>
            <div style="font-weight:700;">${sub.name}</div>
            <div style="font-size:0.75rem; color:var(--portal-text-muted); margin-top:0.25rem;">
              ${teacher ? teacher.fullName : 'Class Teacher'}
            </div>
          </td>
        `;
      }
      row.innerHTML = cellsHtml;
      gridBody.appendChild(row);
    });
  }
})();
