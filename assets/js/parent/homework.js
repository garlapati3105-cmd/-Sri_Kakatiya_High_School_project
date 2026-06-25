// ============================================================
//  Sri Kakatiya School Management Platform – parent/homework.js
//  Parent Homework Controller (Refined)
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    populateFilters();
    renderHomework();
    setupListeners();

    window.addEventListener('skhs_db_synced', () => {
      populateFilters();
      renderHomework();
    });
    window.addEventListener('skhs_parent_child_changed', () => {
      populateFilters();
      renderHomework();
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

  function populateFilters() {
    const studentId = getActiveChildId();
    if (!studentId) return;

    const student = window.skhs_db.findOne('students', 'studentId', studentId);
    if (!student) return;

    const select = document.getElementById('homework-subject-select');
    if (!select) return;

    const subjects = window.skhs_db.find('subjects', 'classId', student.classId);
    select.innerHTML = '<option value="all">All Subjects</option>';
    subjects.forEach(s => {
      const option = document.createElement('option');
      option.value = s.subjectId;
      option.textContent = s.name;
      select.appendChild(option);
    });
  }

  function renderHomework() {
    const studentId = getActiveChildId();
    if (!studentId) return;

    const student = window.skhs_db.findOne('students', 'studentId', studentId);
    if (!student) return;

    const tbody = document.getElementById('homework-roster-body');
    if (!tbody) return;

    const query = document.getElementById('homework-search')?.value.toLowerCase().trim() || '';
    const subjectFilter = document.getElementById('homework-subject-select')?.value || 'all';

    const homework = window.skhs_db.find('homework', 'classId', student.classId);

    const filtered = homework.filter(hw => {
      const matchesSearch = hw.title.toLowerCase().includes(query);
      const matchesSubject = (subjectFilter === 'all' || hw.subjectId === subjectFilter);
      return matchesSearch && matchesSubject;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--portal-text-muted);">No homework tasks found.</td></tr>`;
      return;
    }

    filtered.sort((a, b) => new Date(b.dueDate || b.due_date) - new Date(a.dueDate || a.due_date));

    tbody.innerHTML = '';
    filtered.forEach(hw => {
      const sub = window.skhs_db.findOne('subjects', 'subjectId', hw.subjectId);
      const compList = Array.isArray(hw.completedStudents)
        ? hw.completedStudents
        : String(hw.completedStudents || '').split(',').map(s => s.trim()).filter(Boolean);

      const isDone = compList.includes(studentId);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${sub ? sub.name : 'General'}</strong></td>
        <td>${hw.title}</td>
        <td>${hw.dueDate || hw.due_date}</td>
        <td><span class="badge ${isDone ? 'badge-success' : 'badge-warning'}">${isDone ? 'Completed' : 'Pending'}</span></td>
      `;
      tbody.appendChild(row);
    });
  }

  function setupListeners() {
    const search = document.getElementById('homework-search');
    const select = document.getElementById('homework-subject-select');

    if (search) search.addEventListener('input', renderHomework);
    if (select) select.addEventListener('change', renderHomework);
  }
})();
