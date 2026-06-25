// ============================================================
//  Sri Kakatiya School Management Platform – parent/fees.js
//  Parent Fee Billing Controller (Refined)
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    renderFees();
    window.addEventListener('skhs_db_synced', renderFees);
    window.addEventListener('skhs_parent_child_changed', renderFees);
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

  function renderFees() {
    const studentId = getActiveChildId();
    if (!studentId) return;

    const fees = window.skhs_db.find('fees', 'studentId', studentId);

    const totalEl = document.getElementById('fee-total');
    const paidEl = document.getElementById('fee-paid');
    const pendingEl = document.getElementById('fee-pending');
    const tbody = document.getElementById('fee-roster-body');

    if (!totalEl || !paidEl || !pendingEl || !tbody) return;

    let totalSum = 0;
    let paidSum = 0;
    let pendingSum = 0;

    tbody.innerHTML = '';
    if (fees.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--portal-text-muted);">No fee invoice logs found.</td></tr>`;
      totalEl.textContent = '₹0';
      paidEl.textContent = '₹0';
      pendingEl.textContent = '₹0';
      return;
    }

    fees.forEach(f => {
      totalSum += f.amount || 0;
      if (f.status === 'Paid') {
        paidSum += f.amount || 0;
      } else {
        pendingSum += f.amount || 0;
      }

      let badgeStyle = f.status === 'Paid' ? 'badge-success' : 'badge-critical';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${f.feeType || 'General Fee'}</strong></td>
        <td>₹${f.amount}</td>
        <td>${f.dueDate}</td>
        <td><span class="badge ${badgeStyle}">${f.status}</span></td>
        <td><button class="btn-portal" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="alert('Downloading fee receipt PDF...')">Download Receipt</button></td>
      `;
      tbody.appendChild(row);
    });

    totalEl.textContent = `₹${totalSum}`;
    paidEl.textContent = `₹${paidSum}`;
    pendingEl.textContent = `₹${pendingSum}`;
  }
})();
