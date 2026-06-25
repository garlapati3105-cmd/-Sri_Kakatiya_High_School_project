// ============================================================
//  Sri Kakatiya School Management Platform – student/attendance.js
//  Attendance Monitoring and Trends Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Only run if user is student
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    loadAttendanceData();

    // Listen to data syncs to update attendance page
    window.addEventListener('skhs_db_synced', loadAttendanceData);

    const monthFilter = document.getElementById('att-month-filter');
    if (monthFilter) {
      monthFilter.addEventListener('change', () => {
        const student = window.skhs_db.findOne('students', 'userId', currentUser.userId || currentUser.id);
        if (student) renderHistoryLog(student, monthFilter.value);
      });
    }
  });

  function loadAttendanceData() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const student = window.skhs_db.findOne('students', 'userId', currentUser.userId || currentUser.id);
    if (!student) return;

    const attendanceRecords = window.skhs_db.find('attendance', 'studentId', student.studentId);
    
    // Sort records descending by date
    attendanceRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Stats calculations
    const totalDays = attendanceRecords.length;
    const presents = attendanceRecords.filter(r => r.status === 'Present').length;
    const absents = attendanceRecords.filter(r => r.status === 'Absent').length;
    const lates = 0; // The database check constraint only allows Present/Absent

    document.getElementById('att-present-days').textContent = presents;
    document.getElementById('att-absent-days').textContent = absents;
    document.getElementById('att-late-days').textContent = lates;

    // Load month filter select options
    populateMonthFilter(attendanceRecords);

    // Render monthly trends
    renderMonthlyTrends(attendanceRecords);

    // Render history log
    const monthFilter = document.getElementById('att-month-filter');
    renderHistoryLog(student, monthFilter ? monthFilter.value : 'all');
  }

  function populateMonthFilter(records) {
    const filter = document.getElementById('att-month-filter');
    if (!filter) return;

    // Collect unique months
    const months = new Set();
    records.forEach(r => {
      if (r.date) {
        const dateObj = new Date(r.date);
        const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        months.add(key);
      }
    });

    const currentVal = filter.value || 'all';
    filter.innerHTML = '<option value="all">All Months</option>';

    // Sort months descending
    Array.from(months).sort((a, b) => b.localeCompare(a)).forEach(mKey => {
      const [year, month] = mKey.split('-');
      const date = new Date(year, parseInt(month) - 1, 1);
      const name = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      filter.innerHTML += `<option value="${mKey}">${name}</option>`;
    });

    filter.value = currentVal;
  }

  function renderMonthlyTrends(records) {
    const container = document.getElementById('att-trends-chart');
    if (!container) return;

    if (records.length === 0) {
      container.innerHTML = `<p style="text-align: center; color: var(--portal-text-muted);">No attendance records found to plot trends.</p>`;
      return;
    }

    // Group by month
    const groups = {};
    records.forEach(r => {
      const dateObj = new Date(r.date);
      const mKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[mKey]) groups[mKey] = { present: 0, total: 0 };
      if (r.status === 'Present') groups[mKey].present++;
      groups[mKey].total++;
    });

    // Sort months ascending for trend timeline
    const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    container.innerHTML = '';
    sortedKeys.forEach(mKey => {
      const group = groups[mKey];
      const pct = Math.round((group.present / group.total) * 100);
      const [year, month] = mKey.split('-');
      const date = new Date(year, parseInt(month) - 1, 1);
      const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });

      const barRow = document.createElement('div');
      barRow.style.margin = '0.5rem 0';
      barRow.style.display = 'flex';
      barRow.style.alignItems = 'center';
      barRow.style.gap = '1rem';

      barRow.innerHTML = `
        <div style="width: 80px; font-weight: 500; font-size: 0.85rem;">${label}</div>
        <div style="flex: 1; background: var(--portal-border); height: 12px; border-radius: 6px; overflow: hidden; position: relative;">
          <div style="background: ${pct >= 75 ? 'var(--portal-success)' : 'var(--portal-error)'}; width: ${pct}%; height: 100%; transition: width 0.5s ease-in-out;"></div>
        </div>
        <div style="width: 45px; text-align: right; font-weight: 600; font-size: 0.85rem;">${pct}%</div>
      `;
      container.appendChild(barRow);
    });
  }

  function renderHistoryLog(student, selectedMonth) {
    const tbody = document.getElementById('att-history-body');
    if (!tbody) return;

    let records = window.skhs_db.find('attendance', 'studentId', student.studentId);
    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Filter if needed
    if (selectedMonth && selectedMonth !== 'all') {
      const [year, month] = selectedMonth.split('-');
      records = records.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month);
      });
    }

    if (records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--portal-text-muted);">No attendance records found for this period.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    records.forEach(r => {
      const formattedDate = new Date(r.date).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formattedDate}</td>
        <td>
          <span class="badge ${r.status === 'Present' ? 'badge-success' : 'badge-critical'}">${r.status}</span>
        </td>
      `;
      tbody.appendChild(row);
    });
  }
})();
