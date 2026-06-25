// ============================================================
//  Sri Kakatiya School Management Platform – parent/study-materials.js
//  Parent Study Materials Preview Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'parent') return;

    populateSubjectsFilter();
    renderMaterials();
    setupListeners();

    window.addEventListener('skhs_db_synced', () => {
      populateSubjectsFilter();
      renderMaterials();
    });
  });

  function populateSubjectsFilter() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const parent = window.skhs_db.findOne('parents', 'userId', currentUser.userId || currentUser.id);
    if (!parent) return;

    const linkedStudentIds = Array.isArray(parent.linkedStudents) ? parent.linkedStudents : [];
    if (linkedStudentIds.length === 0) return;

    const student = window.skhs_db.findOne('students', 'studentId', linkedStudentIds[0]);
    if (!student) return;

    const select = document.getElementById('study-subject-select');
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

  function renderMaterials() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const parent = window.skhs_db.findOne('parents', 'userId', currentUser.userId || currentUser.id);
    if (!parent) return;

    const linkedStudentIds = Array.isArray(parent.linkedStudents) ? parent.linkedStudents : [];
    if (linkedStudentIds.length === 0) return;

    const student = window.skhs_db.findOne('students', 'studentId', linkedStudentIds[0]);
    if (!student) return;

    const tbody = document.getElementById('materials-roster-body');
    if (!tbody) return;

    const query = document.getElementById('study-search-input')?.value.toLowerCase().trim() || '';
    const subjectFilter = document.getElementById('study-subject-select')?.value || 'all';

    const materials = window.skhs_db.find('study_materials', 'classId', student.classId);

    const filtered = materials.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(query);
      const matchesSubject = (subjectFilter === 'all' || m.subjectId === subjectFilter);
      return matchesSearch && matchesSubject;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--portal-text-muted);">No study materials matches your search filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    filtered.forEach(m => {
      const sub = window.skhs_db.findOne('subjects', 'subjectId', m.subjectId);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${m.title}</strong></td>
        <td>${sub ? sub.name : 'General'}</td>
        <td><span class="badge badge-info">${m.category}</span></td>
        <td>${m.uploadDate || m.upload_date}</td>
        <td><a href="${m.fileUrl || '#'}" target="_blank" class="btn-portal" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.75rem; text-decoration: none;">Download</a></td>
      `;
      tbody.appendChild(row);
    });
  }

  function setupListeners() {
    const search = document.getElementById('study-search-input');
    const select = document.getElementById('study-subject-select');

    if (search) {
      search.addEventListener('input', renderMaterials);
    }
    if (select) {
      select.addEventListener('change', renderMaterials);
    }
  }
})();
