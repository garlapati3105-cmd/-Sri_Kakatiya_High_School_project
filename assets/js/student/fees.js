// ============================================================
//  Sri Kakatiya School Management Platform – student/fees.js
//  Fee Registry and Invoices Controller (Read-Only)
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Only run if user is student
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    loadFeesData();

    // Listen to data syncs to update fee lists
    window.addEventListener('skhs_db_synced', loadFeesData);
  });

  function loadFeesData() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const student = window.skhs_db.findOne('students', 'userId', currentUser.userId || currentUser.id);
    if (!student) return;

    const paidEl = document.getElementById('fee-stat-paid');
    const pendingEl = document.getElementById('fee-stat-pending');
    const overdueEl = document.getElementById('fee-stat-overdue');
    const tbody = document.getElementById('fee-invoices-body');

    if (!paidEl || !pendingEl || !overdueEl || !tbody) return;

    // FIX: use camelCase 'studentId'
    const invoices = window.skhs_db.find('fees', 'studentId', student.studentId);

    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    const today = new Date().setHours(0,0,0,0);

    tbody.innerHTML = '';

    if (invoices.length === 0) {
      paidEl.textContent = '₹0';
      pendingEl.textContent = '₹0';
      overdueEl.textContent = '₹0';
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--portal-text-muted);">No fee details recorded.</td></tr>`;
      return;
    }

    invoices.forEach(inv => {
      const amount = parseFloat(inv.amount || 0);
      const isPaid = inv.status === 'Paid';
      const isOverdue = !isPaid && new Date(inv.dueDate || inv.due_date) < today;

      if (isPaid) {
        totalPaid += amount;
      } else {
        totalPending += amount;
        if (isOverdue) {
          totalOverdue += amount;
        }
      }

      // Renders Table Row
      const row = document.createElement('tr');
      let statusBadge = 'badge-neutral';
      if (isPaid) statusBadge = 'badge-success';
      else if (isOverdue) statusBadge = 'badge-critical';
      else statusBadge = 'badge-warning';

      const statusText = isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending';

      row.innerHTML = `
        <td style="font-family: monospace; font-size: 0.85rem;">${inv.feeId}</td>
        <td><strong>${inv.feeType}</strong></td>
        <td>₹${amount.toLocaleString()}</td>
        <td>${inv.dueDate}</td>
        <td><span class="badge ${statusBadge}">${statusText}</span></td>
        <td>
          <button class="btn-portal view-receipt-btn" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" data-id="${inv.feeId}">
            👁️ View Detail
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    paidEl.textContent = `₹${totalPaid.toLocaleString()}`;
    pendingEl.textContent = `₹${totalPending.toLocaleString()}`;
    overdueEl.textContent = `₹${totalOverdue.toLocaleString()}`;

    // Bind event listeners for receipt details popup modal
    document.querySelectorAll('.view-receipt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const feeId = e.currentTarget.getAttribute('data-id');
        openReceiptModal(feeId, student);
      });
    });
  }

  function openReceiptModal(feeId, student) {
    // FIX: use camelCase 'feeId'
    const inv = window.skhs_db.findOne('fees', 'feeId', feeId)
             || window.skhs_db.findOne('fees', 'fee_id', feeId);
    if (!inv) return;

    // Check if modal already exists
    let modal = document.getElementById('fee-receipt-modal');
    if (modal) modal.remove();

    // Create modal elements
    modal = document.createElement('div');
    modal.id = 'fee-receipt-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '9999';
    modal.style.backdropFilter = 'blur(4px)';

    const isPaid = inv.status === 'Paid';
    const amount = parseFloat(inv.amount || 0);

    modal.innerHTML = `
      <div class="portal-card" style="width: 90%; max-width: 450px; padding: 2rem; position: relative;">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🦅</div>
          <h3 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; margin-bottom: 0.25rem;">Sri Kakatiya High School</h3>
          <p style="font-size: 0.75rem; color: var(--portal-text-muted); margin: 0;">Official Fee Statement & Invoice</p>
        </div>

        <div style="border-top: 1px dashed var(--portal-border); border-bottom: 1px dashed var(--portal-border); padding: 1rem 0; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem;">
          <div style="display: flex; justify-content: space-between;"><span>Invoice Number:</span><strong>${inv.feeId || inv.fee_id}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Student ID:</span><strong>${student.studentId}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Student Name:</span><strong>${student.fullName}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Fee Type:</span><strong>${inv.feeType || inv.fee_type}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Due Date:</span><strong>${inv.dueDate || inv.due_date}</strong></div>
          <div style="display: flex; justify-content: space-between; font-size: 1.05rem; border-top: 1px solid var(--portal-border); padding-top: 0.5rem; margin-top: 0.25rem;"><span>Total Amount:</span><strong>₹${amount.toLocaleString()}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Status:</span><span class="badge ${isPaid ? 'badge-success' : 'badge-warning'}">${inv.status}</span></div>
        </div>

        <div style="text-align: center; color: var(--portal-text-muted); font-size: 0.75rem; margin-bottom: 1.5rem;">
          ${isPaid 
            ? "Payment verified. Thank you!" 
            : "This is a pending invoice. Please settle outstanding fees at the school administration desk."
          }
        </div>

        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button class="btn-portal" id="fee-receipt-close" style="width: auto; padding: 0.5rem 1.5rem;">Close Details</button>
          ${isPaid ? `<button class="btn-portal" style="width: auto; padding: 0.5rem 1.5rem; background: var(--portal-bg); color: var(--portal-text-main); border: 1px solid var(--portal-border); box-shadow: none;" onclick="window.print()">Print Receipt</button>` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('fee-receipt-close').addEventListener('click', () => {
      modal.remove();
    });
  }
})();
