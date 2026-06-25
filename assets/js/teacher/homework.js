// ============================================================
//  Sri Kakatiya School Management Platform – teacher/homework.js
//  Teacher Homework Management Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'teacher') return;

    // Set default date
    const dateInput = document.getElementById('hw-due-date');
    if (dateInput) {
      dateInput.value = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]; // Default 2 days later
    }

    populateFilters();
    loadHomeworks();
    setupListeners();

    window.addEventListener('skhs_db_synced', () => {
      populateFilters();
      loadHomeworks();
    });
  });

  function populateFilters() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const teacher = window.skhs_db.findOne('teachers', 'userId', currentUser.userId || currentUser.id);
    if (!teacher) return;

    const classSelect = document.getElementById('hw-class');
    const subSelect = document.getElementById('hw-subject');
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

  function loadHomeworks() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const teacher = window.skhs_db.findOne('teachers', 'userId', currentUser.userId || currentUser.id);
    if (!teacher) return;

    const tbody = document.getElementById('homework-roster-body');
    if (!tbody) return;

    const homeworkCollection = window.skhs_db.getCollection('homework');
    const subjects = window.skhs_db.find('subjects', 'teacherId', teacher.teacherId);
    const subjectIds = subjects.map(s => s.subjectId);

    const teacherHomeworks = homeworkCollection.filter(hw => subjectIds.includes(hw.subjectId));

    if (teacherHomeworks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--portal-text-muted);">No homework assigned yet.</td></tr>`;
      return;
    }

    teacherHomeworks.sort((a, b) => new Date(b.dateAssigned || b.date_assigned || Date.now()) - new Date(a.dateAssigned || a.date_assigned || Date.now()));

    tbody.innerHTML = '';
    teacherHomeworks.forEach(hw => {
      const classRecord = window.skhs_db.findOne('classes', 'classId', hw.classId);
      const subRecord = window.skhs_db.findOne('subjects', 'subjectId', hw.subjectId);

      const compList = Array.isArray(hw.completedStudents)
        ? hw.completedStudents
        : String(hw.completedStudents || '').split(',').map(s => s.trim()).filter(Boolean);

      const totalStudents = window.skhs_db.find('students', 'classId', hw.classId).length;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${classRecord ? classRecord.name : hw.classId}</strong></td>
        <td>${subRecord ? subRecord.name : 'General'}</td>
        <td>${hw.title}</td>
        <td>${hw.dueDate || hw.due_date}</td>
        <td><span class="badge badge-info">${compList.length} / ${totalStudents}</span></td>
        <td>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn-portal" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="viewSubmissions('${hw.homeworkId}')">👁️ Review</button>
            <button class="btn-portal" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--portal-warning);" onclick="editHomework('${hw.homeworkId}')">✏️ Edit</button>
            <button class="btn-portal" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--portal-error);" onclick="deleteHomework('${hw.homeworkId}')">🗑️ Delete</button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  function setupListeners() {
    const trigger = document.getElementById('btn-create-homework-trigger');
    const formContainer = document.getElementById('homework-form-container');
    const cancelBtn = document.getElementById('btn-cancel-hw');
    const form = document.getElementById('homework-creation-form');
    const alertContainer = document.getElementById('dashboard-alert-container');
    const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

    if (trigger) {
      trigger.addEventListener('click', () => {
        document.getElementById('hw-form-title').textContent = "Assign New Homework";
        form.reset();
        document.getElementById('hw-edit-id').value = '';
        formContainer.style.display = 'block';
        formContainer.scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        formContainer.style.display = 'none';
        form.reset();
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const editId = document.getElementById('hw-edit-id').value;
        const classId = document.getElementById('hw-class').value;
        const subjectId = document.getElementById('hw-subject').value;
        const title = document.getElementById('hw-title').value.trim();
        const desc = document.getElementById('hw-desc').value.trim();
        const dueDate = document.getElementById('hw-due-date').value;
        const attachment = document.getElementById('hw-attachment').value.trim();

        if (editId) {
          // Edit existing
          await window.skhs_db.update('homework', 'homeworkId', editId, {
            classId,
            subjectId,
            title,
            description: desc,
            dueDate,
            attachmentUrl: attachment
          });
          showAlert("Homework assignment updated successfully!", "success");
        } else {
          // Create new
          const newHw = {
            homeworkId: window.createId('HW'),
            classId,
            subjectId,
            title,
            description: desc,
            dateAssigned: new Date().toISOString().split('T')[0],
            dueDate,
            completedStudents: [],
            attachmentUrl: attachment,
            academicYear: "AY-2026-27"
          };
          await window.skhs_db.insert('homework', newHw);
          showAlert("Homework assigned successfully!", "success");
        }

        form.reset();
        formContainer.style.display = 'none';
        window.dispatchEvent(new Event('skhs_db_synced'));
      });
    }

    // Close submissions panel
    const closeSubsBtn = document.getElementById('btn-close-submissions');
    if (closeSubsBtn) {
      closeSubsBtn.addEventListener('click', () => {
        document.getElementById('homework-submissions-container').style.display = 'none';
      });
    }
  }

  // Exposed Actions
  window.viewSubmissions = function (homeworkId) {
    const container = document.getElementById('homework-submissions-container');
    const tbody = document.getElementById('hw-submissions-body');
    if (!container || !tbody) return;

    const hw = window.skhs_db.findOne('homework', 'homeworkId', homeworkId);
    if (!hw) return;

    document.getElementById('submissions-panel-title').textContent = `Submissions: ${hw.title}`;
    tbody.innerHTML = '';

    const students = window.skhs_db.find('students', 'classId', hw.classId);
    const compList = Array.isArray(hw.completedStudents)
      ? hw.completedStudents
      : String(hw.completedStudents || '').split(',').map(s => s.trim()).filter(Boolean);

    students.forEach(student => {
      const isDone = compList.includes(student.studentId);
      const row = document.createElement('tr');

      row.innerHTML = `
        <td><strong>${student.fullName}</strong></td>
        <td>${student.rollNumber || '--'}</td>
        <td>
          <span class="badge ${isDone ? 'badge-success' : 'badge-warning'}">${isDone ? 'Submitted' : 'Pending'}</span>
        </td>
        <td>
          <button class="btn-portal" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.75rem;" ${isDone ? 'disabled' : ''} onclick="toggleSubmissionState('${hw.homeworkId}', '${student.studentId}')">
            ${isDone ? 'Mark Pending' : 'Mark Reviewed'}
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth' });
  };

  window.toggleSubmissionState = async function (homeworkId, studentId) {
    const hw = window.skhs_db.findOne('homework', 'homeworkId', homeworkId);
    if (!hw) return;

    let compList = Array.isArray(hw.completedStudents)
      ? [...hw.completedStudents]
      : String(hw.completedStudents || '').split(',').map(s => s.trim()).filter(Boolean);

    if (compList.includes(studentId)) {
      compList = compList.filter(s => s !== studentId);
    } else {
      compList.push(studentId);
    }

    await window.skhs_db.update('homework', 'homeworkId', homeworkId, {
      completedStudents: compList
    });

    window.dispatchEvent(new Event('skhs_db_synced'));
    setTimeout(() => viewSubmissions(homeworkId), 100);
  };

  window.editHomework = function (homeworkId) {
    const hw = window.skhs_db.findOne('homework', 'homeworkId', homeworkId);
    if (!hw) return;

    document.getElementById('homework-form-container').style.display = 'block';
    document.getElementById('hw-form-title').textContent = "Edit Homework Assignment";
    document.getElementById('hw-edit-id').value = hw.homeworkId;
    document.getElementById('hw-class').value = hw.classId;
    document.getElementById('hw-subject').value = hw.subjectId;
    document.getElementById('hw-title').value = hw.title;
    document.getElementById('hw-desc').value = hw.description;
    document.getElementById('hw-due-date').value = hw.dueDate || hw.due_date;
    document.getElementById('hw-attachment').value = hw.attachmentUrl || '';

    document.getElementById('homework-form-container').scrollIntoView({ behavior: 'smooth' });
  };

  window.deleteHomework = async function (homeworkId) {
    if (!confirm("Are you sure you want to delete this homework assignment?")) return;
    await window.skhs_db.delete('homework', 'homeworkId', homeworkId);
    window.dispatchEvent(new Event('skhs_db_synced'));
  };
})();
