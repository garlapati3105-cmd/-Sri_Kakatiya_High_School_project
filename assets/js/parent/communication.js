// ============================================================
//  Sri Kakatiya School Management Platform – parent/communication.js
//  Parent Communication Ticket Controller (Refined)
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    populateRecipients();
    loadMessages();
    setupListeners();

    window.addEventListener('skhs_db_synced', () => {
      populateRecipients();
      loadMessages();
    });
    window.addEventListener('skhs_parent_child_changed', () => {
      populateRecipients();
      loadMessages();
    });
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

  function populateRecipients() {
    const select = document.getElementById('msg-recipient');
    if (!select) return;

    const childId = getActiveChildId();
    if (!childId) return;

    const student = window.skhs_db.findOne('students', 'studentId', childId);
    if (!student) return;

    select.innerHTML = '<option value="">-- Choose Recipient --</option>';
    
    // Add Office / Administration
    const adminOpt = document.createElement('option');
    adminOpt.value = "admin";
    adminOpt.textContent = "School Administration Office";
    select.appendChild(adminOpt);

    // Get subject teachers of the class
    const subjects = window.skhs_db.find('subjects', 'classId', student.classId);
    subjects.forEach(s => {
      const teacher = window.skhs_db.findOne('teachers', 'teacherId', s.teacherId);
      if (teacher) {
        const option = document.createElement('option');
        option.value = teacher.teacherId;
        option.textContent = `${teacher.fullName} (${s.name})`;
        select.appendChild(option);
      }
    });
  }

  function loadMessages() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const parent = window.skhs_db.findOne('parents', 'userId', currentUser.userId || currentUser.id);
    if (!parent) return;

    const list = document.getElementById('message-history-list');
    if (!list) return;

    // Filter simple ticket logs
    const messages = window.skhs_db.find('messages', 'senderId', parent.parentId);

    if (messages.length === 0) {
      list.innerHTML = `<p style="text-align: center; color: var(--portal-text-muted);">No query tickets filed.</p>`;
      return;
    }

    messages.sort((a, b) => b.timestamp - a.timestamp);

    list.innerHTML = '';
    messages.forEach(m => {
      let recipientName = "Office Admin";
      if (m.recipientId !== 'admin') {
        const teacher = window.skhs_db.findOne('teachers', 'teacherId', m.recipientId);
        if (teacher) recipientName = teacher.fullName;
      }

      const item = document.createElement('div');
      item.style = `
        padding: 0.75rem;
        border: 1px solid var(--portal-border);
        border-radius: 8px;
        background: var(--portal-bg-card);
        margin-bottom: 0.5rem;
      `;
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.25rem;">
          <span style="color: var(--portal-text-muted);">Recipient: <strong>${recipientName}</strong></span>
          <span class="badge badge-info">${m.category || 'General'}</span>
        </div>
        <div style="font-size: 0.85rem; line-height: 1.4; font-weight: 500;">${m.message}</div>
        <div style="text-align: right; font-size: 0.65rem; color: var(--portal-text-muted); margin-top: 0.25rem;">
          Ticket ID: ${m.messageId} | ${new Date(m.timestamp).toLocaleDateString()}
        </div>
      `;
      list.appendChild(item);
    });
  }

  function setupListeners() {
    const form = document.getElementById('message-form');
    const alertContainer = document.getElementById('dashboard-alert-container');
    const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentUser = window.skhs_auth.getCurrentUser();
        const parent = window.skhs_db.findOne('parents', 'userId', currentUser.userId || currentUser.id);
        if (!parent) return;

        const recipientId = document.getElementById('msg-recipient').value;
        const category = document.getElementById('msg-category').value;
        const message = document.getElementById('msg-body').value.trim();

        if (!recipientId) {
          showAlert("Please select a recipient.", "error");
          return;
        }

        const newMessage = {
          messageId: window.createId('MSG'),
          senderId: parent.parentId,
          senderName: parent.fullName,
          recipientId: recipientId,
          category: category,
          message: message,
          timestamp: Date.now()
        };

        const res = await window.skhs_db.insert('messages', newMessage);
        if (res) {
          showAlert("Query ticket submitted successfully!", "success");
          form.reset();
          window.dispatchEvent(new Event('skhs_db_synced'));
        } else {
          showAlert("Failed to file query ticket.", "error");
        }
      });
    }
  }
})();
