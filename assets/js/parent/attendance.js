// ============================================================
//  Sri Kakatiya School Management Platform – parent/attendance.js
//  Parent Attendance Monitoring Controller (Refined)
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    renderAttendance();
    window.addEventListener('skhs_db_synced', renderAttendance);
    window.addEventListener('skhs_parent_child_changed', renderAttendance);
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

  function renderAttendance() {
    const studentId = getActiveChildId();
    if (!studentId) return;

    const attRecords = window.skhs_db.find('attendance', 'studentId', studentId);

    const presentEl = document.getElementById('att-present-days');
    const absentEl = document.getElementById('att-absent-days');
    const totalEl = document.getElementById('att-total-days');
    const trendBar = document.getElementById('att-trend-bar');
    const trendText = document.getElementById('att-trend-text');
    const tbody = document.getElementById('att-history-body');

    if (!presentEl || !absentEl || !totalEl || !trendBar || !trendText || !tbody) return;

    const presents = attRecords.filter(r => r.status === 'Present').length;
    const absents = attRecords.filter(r => r.status === 'Absent').length;
    const total = attRecords.length;
    const pct = total > 0 ? Math.round((presents / total) * 100) : 100;

    presentEl.textContent = presents;
    absentEl.textContent = absents;
    totalEl.textContent = total;

    trendBar.style.width = `${pct}%`;
    trendText.textContent = `${pct}%`;
    trendBar.style.background = pct >= 75 ? 'var(--portal-success)' : 'var(--portal-error)';

    if (attRecords.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--portal-text-muted);">No attendance records found.</td></tr>`;
      return;
    }

    attRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = '';
    attRecords.forEach(a => {
      const row = document.createElement('tr');
      let badgeStyle = 'badge-success';
      if (a.status === 'Absent') badgeStyle = 'badge-critical';
      else if (a.status === 'Leave') badgeStyle = 'badge-warning';

      row.innerHTML = `
        <td><strong>${a.date}</strong></td>
        <td><span class="badge ${badgeStyle}">${a.status}</span></td>
      `;
      tbody.appendChild(row);
    });
  }
})();
