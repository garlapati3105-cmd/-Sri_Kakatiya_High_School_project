// ============================================================
//  Sri Kakatiya School Management Platform – teacher/study-materials.js
//  Teacher Study Materials Management Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'teacher') return;

    populateFormSelectors();
    loadMaterials();
    setupListeners();

    window.addEventListener('skhs_db_synced', () => {
      populateFormSelectors();
      loadMaterials();
    });
  });

  function populateFormSelectors() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const teacher = window.skhs_db.findOne('teachers', 'userId', currentUser.userId || currentUser.id);
    if (!teacher) return;

    const classSelect = document.getElementById('mat-class');
    const subSelect = document.getElementById('mat-subject');
    if (!classSelect || !subSelect) return;

    const assignedClasses = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [];
    classSelect.innerHTML = '';
    assignedClasses.forEach(classId => {
      const classRecord = window.skhs_db.findOne('classes', 'classId', classId);
      const option = document.createElement('option');
      option.value = classId;
      option.textContent = classRecord ? classRecord.name : classId;
      classSelect.appendChild(option);
    });

    const subjects = window.skhs_db.find('subjects', 'teacherId', teacher.teacherId);
    subSelect.innerHTML = '';
    subjects.forEach(s => {
      const option = document.createElement('option');
      option.value = s.subjectId;
      option.textContent = s.name;
      subSelect.appendChild(option);
    });
  }

  function loadMaterials() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const teacher = window.skhs_db.findOne('teachers', 'userId', currentUser.userId || currentUser.id);
    if (!teacher) return;

    const tbody = document.getElementById('materials-roster-body');
    if (!tbody) return;

    const materials = window.skhs_db.find('study_materials', 'uploadedBy', teacher.teacherId);

    if (materials.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--portal-text-muted);">No study materials uploaded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    materials.forEach(mat => {
      const classRecord = window.skhs_db.findOne('classes', 'classId', mat.classId);
      const subRecord = window.skhs_db.findOne('subjects', 'subjectId', mat.subjectId);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong><a href="${mat.fileUrl || '#'}" target="_blank" style="color: var(--portal-primary-light); text-decoration: underline;">${mat.title}</a></strong></td>
        <td>${classRecord ? classRecord.name : mat.classId}</td>
        <td>${subRecord ? subRecord.name : 'General'}</td>
        <td><span class="badge badge-info">${mat.category}</span></td>
        <td>
          <button class="btn-portal" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--portal-error);" onclick="deleteMaterial('${mat.materialId}')">🗑️ Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  function setupListeners() {
    const form = document.getElementById('material-upload-form');
    const alertContainer = document.getElementById('dashboard-alert-container');
    const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentUser = window.skhs_auth.getCurrentUser();
        const teacher = window.skhs_db.findOne('teachers', 'userId', currentUser.userId || currentUser.id);
        if (!teacher) return;

        const title = document.getElementById('mat-title').value.trim();
        const classId = document.getElementById('mat-class').value;
        const subjectId = document.getElementById('mat-subject').value;
        const category = document.getElementById('mat-category').value;
        const url = document.getElementById('mat-url').value.trim();

        const newMat = {
          materialId: window.createId('MAT'),
          title: title,
          subjectId: subjectId,
          classId: classId,
          fileUrl: url,
          category: category,
          uploadedBy: teacher.teacherId,
          uploadDate: new Date().toISOString().split('T')[0]
        };

        const res = await window.skhs_db.insert('study_materials', newMat);
        if (res) {
          showAlert("Study material uploaded successfully!", "success");
          form.reset();
          window.dispatchEvent(new Event('skhs_db_synced'));
        } else {
          showAlert("Failed to upload study material.", "error");
        }
      });
    }
  }

  window.deleteMaterial = async function (materialId) {
    if (!confirm("Are you sure you want to delete this study material?")) return;
    await window.skhs_db.delete('study_materials', 'materialId', materialId);
    window.dispatchEvent(new Event('skhs_db_synced'));
  };
})();
