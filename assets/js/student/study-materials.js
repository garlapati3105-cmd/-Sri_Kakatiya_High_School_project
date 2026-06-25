// ============================================================
//  Sri Kakatiya School Management Platform – student/study-materials.js
//  Study Materials Search and Filtering Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    loadStudyMaterials();
    window.addEventListener('skhs_db_synced', loadStudyMaterials);

    const searchInput = document.getElementById('study-material-search');
    const subjectFilter = document.getElementById('study-material-subject');
    const categoryFilter = document.getElementById('study-material-category');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (subjectFilter) subjectFilter.addEventListener('change', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
  });

  function loadStudyMaterials() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const student = window.skhs_db.findOne('students', 'userId', currentUser.userId || currentUser.id);
    if (!student) return;

    populateSubjectFilters(student);
    applyFilters();
  }

  function populateSubjectFilters(student) {
    const filter = document.getElementById('study-material-subject');
    if (!filter) return;

    // FIX: use camelCase 'classId'
    const subjects = window.skhs_db.find('subjects', 'classId', student.classId);
    const currentVal = filter.value || 'all';

    filter.innerHTML = '<option value="all">All Subjects</option>';
    subjects.forEach(sub => {
      filter.innerHTML += `<option value="${sub.subjectId || sub.subject_id}">${sub.name}</option>`;
    });

    filter.value = currentVal;
  }

  function applyFilters() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const student = window.skhs_db.findOne('students', 'userId', currentUser.userId || currentUser.id);
    if (!student) return;

    const tbody = document.getElementById('study-materials-body');
    if (!tbody) return;

    const searchVal = (document.getElementById('study-material-search')?.value || '').toLowerCase().trim();
    const subjectVal = document.getElementById('study-material-subject')?.value || 'all';
    const categoryVal = document.getElementById('study-material-category')?.value || 'all';

    // FIX: use camelCase 'classId'
    let materials = window.skhs_db.find('study_materials', 'classId', student.classId);

    if (subjectVal !== 'all') {
      // FIX: use camelCase 'subjectId'
      materials = materials.filter(m => (m.subjectId || m.subject_id) === subjectVal);
    }
    if (categoryVal !== 'all') {
      materials = materials.filter(m => m.category === categoryVal);
    }
    if (searchVal !== '') {
      materials = materials.filter(m => m.title.toLowerCase().includes(searchVal));
    }

    if (materials.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--portal-text-muted);">No matching study materials found.</td></tr>`;
      return;
    }

    // Sort by upload date descending
    materials.sort((a, b) => new Date(b.uploadDate || b.upload_date) - new Date(a.uploadDate || a.upload_date));

    tbody.innerHTML = '';
    materials.forEach(m => {
      // FIX: use camelCase 'subjectId'
      const sub = window.skhs_db.findOne('subjects', 'subjectId', m.subjectId || m.subject_id);
      const subName = sub ? sub.name : 'General';
      const dateStr = m.uploadDate || m.upload_date;
      const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <span style="font-size: 1.25rem; margin-right: 0.5rem;">📄</span>
          <strong>${m.title}</strong>
        </td>
        <td><span class="badge badge-info">${m.category}</span></td>
        <td>${subName}</td>
        <td>${formattedDate}</td>
        <td>
          <a class="btn-portal" style="padding: 0.25rem 0.75rem; text-decoration: none; text-align: center;"
             href="${m.fileUrl || m.file_url}" target="_blank" rel="noopener noreferrer">
            📥 Download
          </a>
        </td>
      `;
      tbody.appendChild(row);
    });
  }
})();
