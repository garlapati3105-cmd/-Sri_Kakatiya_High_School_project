// ============================================================
//  Sri Kakatiya School Management Platform – student/leaves.js
//  Leave Application and History Logs Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Only run if user is student
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    loadLeavesData();

    // Listen to data syncs to update leaves view
    window.addEventListener('skhs_db_synced', loadLeavesData);

    const form = document.getElementById('leave-application-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const student = window.skhs_db.findOne('students', 'userId', currentUser.userId || currentUser.id);
        if (!student) return;

        const type = document.getElementById('leave-type').value;
        const startDate = document.getElementById('leave-start-date').value;
        const endDate = document.getElementById('leave-end-date').value;
        const reason = document.getElementById('leave-reason').value.trim();

        const alertContainer = document.getElementById('dashboard-alert-container');
        const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

        // Validation: Start Date cannot be in the past, End Date cannot be before Start Date
        const today = new Date().setHours(0,0,0,0);
        if (new Date(startDate) < today) {
          showAlert("Start Date cannot be in the past.", "error");
          return;
        }
        if (new Date(endDate) < new Date(startDate)) {
          showAlert("End Date cannot be before Start Date.", "error");
          return;
        }

        // Insert new record into leave_requests — use camelCase to match seed data format
        const newLeave = {
          leaveId: window.createId('LV'),
          applicantId: student.studentId,
          applicantName: student.fullName,
          applicantType: 'Student',
          reason: `${type}: ${reason}`,
          startDate: startDate,
          endDate: endDate,
          status: 'Pending'
        };

        const res = await window.skhs_db.insert('leave_requests', newLeave);
        if (res) {
          // Log Audit Action
          await window.skhs_db.logActivity(
            'leave_apply',
            'leaves',
            'info',
            student.userId || student.user_id,
            newLeave.leaveId,
            `Leave request applied from ${startDate} to ${endDate}.`
          );

          showAlert("Leave application submitted successfully!", "success");
          form.reset();
          loadLeavesData();
          
          // Trigger global sync event
          window.dispatchEvent(new Event('skhs_db_synced'));
        } else {
          showAlert("Failed to submit leave request.", "error");
        }
      });
    }
  });

  function loadLeavesData() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const student = window.skhs_db.findOne('students', 'userId', currentUser.userId || currentUser.id);
    if (!student) return;

    const approvedEl = document.getElementById('leave-stat-approved');
    const pendingEl = document.getElementById('leave-stat-pending');
    const rejectedEl = document.getElementById('leave-stat-rejected');
    const tbody = document.getElementById('leaves-history-body');

    if (!approvedEl || !pendingEl || !rejectedEl || !tbody) return;

    // FIX: use camelCase 'applicantId'
    const leaves = window.skhs_db.find('leave_requests', 'applicantId', student.studentId);

    // Calculate totals
    const approved = leaves.filter(l => l.status === 'Approved').length;
    const pending = leaves.filter(l => l.status === 'Pending').length;
    const rejected = leaves.filter(l => l.status === 'Rejected').length;

    approvedEl.textContent = approved;
    pendingEl.textContent = pending;
    rejectedEl.textContent = rejected;

    // Render Table Rows
    if (leaves.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--portal-text-muted);">No leave requests filed yet.</td></tr>`;
      return;
    }

    // Sort descending by date
    leaves.sort((a, b) => new Date(b.startDate || b.start_date) - new Date(a.startDate || a.start_date));

    tbody.innerHTML = '';
    leaves.forEach(l => {
      let statusBadge = 'badge-neutral';
      if (l.status === 'Approved') statusBadge = 'badge-success';
      else if (l.status === 'Pending') statusBadge = 'badge-warning';
      else if (l.status === 'Rejected') statusBadge = 'badge-critical';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${l.reason ? l.reason.split(':')[0] : 'General Leave'}</strong></td>
        <td>${(l.startDate || l.start_date)} to ${(l.endDate || l.end_date)}</td>
        <td><small>${l.reason ? l.reason.substring(l.reason.indexOf(':') + 1).trim() : 'N/A'}</small></td>
        <td><span class="badge ${statusBadge}">${l.status}</span></td>
      `;
      tbody.appendChild(row);
    });
  }
})();
