// ============================================================
//  Sri Kakatiya School Management Platform – teacher/timetable.js
//  Teacher Timetable Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'teacher') return;

    renderTimetable();
    window.addEventListener('skhs_db_synced', renderTimetable);
  });

  function renderTimetable() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const teacher = window.skhs_db.findOne('teachers', 'userId', currentUser.userId || currentUser.id);
    if (!teacher) return;

    const gridBody = document.getElementById('timetable-grid-body');
    if (!gridBody) return;

    const subjects = window.skhs_db.find('subjects', 'teacherId', teacher.teacherId);
    if (subjects.length === 0) {
      gridBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--portal-text-muted);">No assigned subject timetable records found.</td></tr>`;
      return;
    }

    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayIndex = new Date().getDay();
    const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex];
    const currentHour = new Date().getHours();

    gridBody.innerHTML = '';
    weekdays.forEach(day => {
      const isToday = (day === currentDay);
      const row = document.createElement('tr');
      if (isToday) {
        row.style.background = 'rgba(10, 45, 110, 0.05)';
        row.style.fontWeight = '600';
      }

      let cellsHtml = `<td><strong>${day}</strong></td>`;
      for (let period = 1; period <= 6; period++) {
        // Deterministic mapping to display subjects
        const sub = subjects[(period + day.length) % subjects.length];
        const classRecord = window.skhs_db.findOne('classes', 'classId', sub.classId);
        
        // Highlight active current cell
        const isCurrentPeriod = isToday && (
          (period === 1 && currentHour === 8) ||
          (period === 2 && currentHour === 9) ||
          (period === 3 && currentHour === 10) ||
          (period === 4 && currentHour === 11) ||
          (period === 5 && currentHour === 13) ||
          (period === 6 && currentHour === 14)
        );

        const highlightStyle = isCurrentPeriod ? 'background: rgba(245, 166, 35, 0.2); border: 2px solid var(--portal-accent);' : '';

        cellsHtml += `
          <td style="${highlightStyle}">
            <div style="font-weight:700;">${sub.name}</div>
            <div style="font-size:0.75rem; color:var(--portal-text-muted); margin-top:0.25rem;">
              ${classRecord ? classRecord.name : sub.classId}
            </div>
          </td>
        `;
      }
      row.innerHTML = cellsHtml;
      gridBody.appendChild(row);
    });
  }
})();
