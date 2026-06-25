// ============================================================
//  Sri Kakatiya School Management Platform – parent/leaves.js
//  Parent Absence Leave Controller (Refined)
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    loadLeavesHistory();
    setupListeners();

    window.addEventListener('skhs_db_synced', loadLeavesHistory);
    window.addEventListener('skhs_parent_child_changed', loadLeavesHistory);
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

  function loadLeavesHistory() {
    const studentId = getActiveChildId();
    if (!studentId) return;

    const tbody = document.getElementById('leaves-history-body');
    if (!tbody) return;

    const leaves = window.skhs_db.find('leave_requests', 'applicantId', studentId);

    if (leaves.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--portal-text-muted);">No student leave requests found.</td></tr>`;
      return;
    }

    leaves.sort((a, b) => new Date(b.startDate || b.start_date) - new Date(a.startDate || a.start_date));

    tbody.innerHTML = '';
    leaves.forEach(l => {
      let statusBadge = 'badge-neutral';
      if (l.status === 'Approved') statusBadge = 'badge-success';
      else if (l.status === 'Pending') statusBadge = 'badge-warning';
      else if (l.status === 'Rejected') statusBadge = 'badge-critical';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${l.startDate || l.start_date} to ${l.endDate || l.end_date}</td>
        <td><small>${l.reason || 'N/A'}</small></td>
        <td><span class="badge ${statusBadge}">${l.status}</span></td>
      `;
      tbody.appendChild(row);
    });
  }

  function setupListeners() {
    const form = document.getElementById('leave-application-form');
    const alertContainer = document.getElementById('dashboard-alert-container');
    const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const studentId = getActiveChildId();
        if (!studentId) return;

        const student = window.skhs_db.findOne('students', 'studentId', studentId);
        if (!student) return;

        const startDate = document.getElementById('leave-start-date').value;
        const endDate = document.getElementById('leave-end-date').value;
        const reason = document.getElementById('leave-reason').value.trim();

        const today = new Date().setHours(0, 0, 0, 0);
        if (new Date(startDate) < today) {
          showAlert("Start Date cannot be in the past.", "error");
          return;
        }
        if (new Date(endDate) < new Date(startDate)) {
          showAlert("End Date cannot be before Start Date.", "error");
          return;
        }

        const newLeave = {
          leaveId: window.createId('LV'),
          applicantId: student.studentId,
          applicantName: student.fullName,
          applicantType: 'Student',
          reason: `Parent Applied: ${reason}`,
          startDate: startDate,
          endDate: endDate,
          status: 'Pending'
        };

        const res = await window.skhs_db.insert('leave_requests', newLeave);
        if (res) {
          showAlert("Absence request submitted successfully!", "success");
          form.reset();
          window.dispatchEvent(new Event('skhs_db_synced'));
        } else {
          showAlert("Failed to submit request.", "error");
        }
      });
    }
  }
})();
