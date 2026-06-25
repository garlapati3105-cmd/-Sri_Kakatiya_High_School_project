// ============================================================
//  Sri Kakatiya School Management Platform – parent/ptm.js
//  Parent-Teacher Meeting (PTM) Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    // Set date input to tomorrow by default
    const dateInput = document.getElementById('ptm-date');
    if (dateInput) {
      dateInput.value = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    }

    populateTeachers();
    loadPTMs();
    setupListeners();

    window.addEventListener('skhs_db_synced', () => {
      populateTeachers();
      loadPTMs();
    });
    window.addEventListener('skhs_parent_child_changed', () => {
      populateTeachers();
      loadPTMs();
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

  function populateTeachers() {
    const select = document.getElementById('ptm-teacher');
    if (!select) return;

    const childId = getActiveChildId();
    if (!childId) return;

    const student = window.skhs_db.findOne('students', 'studentId', childId);
    if (!student) return;

    const subjects = window.skhs_db.find('subjects', 'classId', student.classId);
    select.innerHTML = '<option value="">-- Select Teacher --</option>';
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

  function loadPTMs() {
    const list = document.getElementById('ptm-list');
    if (!list) return;

    const childId = getActiveChildId();
    if (!childId) return;

    // Fetch scheduled PTMs from calendar events
    const scheduledEvents = window.skhs_db.getCollection('calendar_events').filter(e => e.category === 'Meeting');

    // Retrieve parent-requested PTMs from localStorage to support state
    const ptmRequestsKey = `skhs_ptm_requests_${childId}`;
    const ptmRequests = JSON.parse(localStorage.getItem(ptmRequestsKey) || "[]");

    list.innerHTML = '';
    
    // 1. Render Parent Requests
    ptmRequests.forEach(req => {
      const teacher = window.skhs_db.findOne('teachers', 'teacherId', req.teacherId);
      const card = document.createElement('div');
      card.style = `
        padding: 0.75rem;
        border: 1px solid var(--portal-border);
        border-radius: 8px;
        background: var(--portal-bg-card);
        margin-bottom: 0.5rem;
      `;
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.25rem;">
          <span style="font-weight: 700;">Meeting Request</span>
          <span class="badge badge-warning">${req.status}</span>
        </div>
        <div style="font-size: 0.85rem;">Teacher: <strong>${teacher ? teacher.fullName : 'Class Teacher'}</strong></div>
        <div style="font-size: 0.8rem; color: var(--portal-text-muted); margin-top: 0.15rem;">Proposed Date: ${req.date}</div>
        <div style="font-size: 0.8rem; margin-top: 0.25rem;"><em>"${req.notes}"</em></div>
      `;
      list.appendChild(card);
    });

    // 2. Render Scheduled General Meetings
    scheduledEvents.forEach(e => {
      const card = document.createElement('div');
      card.style = `
        padding: 0.75rem;
        border: 1px solid var(--portal-accent);
        border-radius: 8px;
        background: var(--portal-bg-card);
        margin-bottom: 0.5rem;
      `;
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.25rem;">
          <span style="font-weight: 700; color: var(--portal-accent-dark);">General PTM</span>
          <span class="badge badge-success">Scheduled</span>
        </div>
        <div style="font-size: 0.85rem;"><strong>${e.title}</strong></div>
        <div style="font-size: 0.8rem; color: var(--portal-text-muted); margin-top: 0.15rem;">Date: ${e.startDate}</div>
        <div style="font-size: 0.8rem; margin-top: 0.25rem;">${e.description}</div>
      `;
      list.appendChild(card);
    });

    if (ptmRequests.length === 0 && scheduledEvents.length === 0) {
      list.innerHTML = `<p style="text-align: center; color: var(--portal-text-muted);">No PTM meetings scheduled.</p>`;
    }
  }

  function setupListeners() {
    const form = document.getElementById('ptm-request-form');
    const alertContainer = document.getElementById('dashboard-alert-container');
    const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const childId = getActiveChildId();
        if (!childId) return;

        const teacherId = document.getElementById('ptm-teacher').value;
        const date = document.getElementById('ptm-date').value;
        const notes = document.getElementById('ptm-notes').value.trim();

        if (!teacherId) {
          showAlert("Please select a teacher.", "error");
          return;
        }

        const ptmRequestsKey = `skhs_ptm_requests_${childId}`;
        const ptmRequests = JSON.parse(localStorage.getItem(ptmRequestsKey) || "[]");

        ptmRequests.push({
          requestId: window.createId('PTM'),
          teacherId: teacherId,
          date: date,
          notes: notes,
          status: 'Pending'
        });

        localStorage.setItem(ptmRequestsKey, JSON.stringify(ptmRequests));
        showAlert("PTM consultation request submitted to teacher!", "success");
        form.reset();
        loadPTMs();
      });
    }
  }
})();
