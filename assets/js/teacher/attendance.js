// ============================================================
//  Sri Kakatiya School Management Platform – teacher/attendance.js
//  Teacher Attendance Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'teacher') return;

    // Set default date to today
    const dateInput = document.getElementById('att-date-input');
    if (dateInput) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    populateClasses();
    setupListeners();

    window.addEventListener('skhs_db_synced', populateClasses);
  });

  function populateClasses() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const teacher = window.skhs_db.findOne('teachers', 'userId', currentUser.userId || currentUser.id);
    if (!teacher) return;

    const select = document.getElementById('att-class-select');
    if (!select) return;

    const assignedClasses = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [];
    select.innerHTML = '';
    assignedClasses.forEach(classId => {
      const classRecord = window.skhs_db.findOne('classes', 'classId', classId);
      const option = document.createElement('option');
      option.value = classId;
      option.textContent = classRecord ? classRecord.name : classId;
      select.appendChild(option);
    });
  }

  function setupListeners() {
    const loadBtn = document.getElementById('btn-load-attendance');
    const saveBtn = document.getElementById('btn-save-attendance');
    const bulkBtn = document.getElementById('btn-bulk-present');
    const rosterBody = document.getElementById('attendance-roster-body');
    const alertContainer = document.getElementById('dashboard-alert-container');
    const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

    if (loadBtn) {
      loadBtn.addEventListener('click', () => {
        const classId = document.getElementById('att-class-select').value;
        const section = document.getElementById('att-section-select').value;
        const date = document.getElementById('att-date-input').value;

        if (!classId || !date) {
          showAlert("Please select a class and a date.", "error");
          return;
        }

        loadRoster(classId, section, date);
      });
    }

    if (bulkBtn) {
      bulkBtn.addEventListener('click', () => {
        const radios = document.querySelectorAll('input[value="Present"]');
        if (radios.length === 0) {
          showAlert("Please load the student roster first.", "error");
          return;
        }
        radios.forEach(r => r.checked = true);
        showAlert("All students marked Present.", "info");
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const classId = document.getElementById('att-class-select').value;
        const date = document.getElementById('att-date-input').value;
        const rows = rosterBody.querySelectorAll('tr[data-student-id]');

        if (rows.length === 0) {
          showAlert("No roster loaded to save.", "error");
          return;
        }

        const attendanceRecords = window.skhs_db.getCollection('attendance');
        let savedCount = 0;

        for (const row of rows) {
          const studentId = row.getAttribute('data-student-id');
          const selectedStatus = row.querySelector('input[type="radio"]:checked')?.value || 'Present';

          // Check if record exists
          const existing = attendanceRecords.find(a => a.studentId === studentId && a.date === date);
          if (existing) {
            await window.skhs_db.update('attendance', 'attendanceId', existing.attendanceId, {
              status: selectedStatus
            });
          } else {
            await window.skhs_db.insert('attendance', {
              attendanceId: window.createId('ATT'),
              date: date,
              studentId: studentId,
              classId: classId,
              status: selectedStatus,
              academicYear: "AY-2026-27"
            });
          }
          savedCount++;
        }

        showAlert(`Successfully saved attendance logs for ${savedCount} students.`, "success");
        window.dispatchEvent(new Event('skhs_db_synced'));
        loadRoster(classId, document.getElementById('att-section-select').value, date);
      });
    }
  }

  function loadRoster(classId, section, date) {
    const rosterBody = document.getElementById('attendance-roster-body');
    if (!rosterBody) return;

    const students = window.skhs_db.find('students', 'classId', classId);
    const sectionStudents = students.filter(s => (s.section || 'A').toUpperCase() === section.toUpperCase());

    if (sectionStudents.length === 0) {
      rosterBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--portal-text-muted);">No students found in this section.</td></tr>`;
      updateAnalytics(0, 0);
      return;
    }

    rosterBody.innerHTML = '';
    const attendanceRecords = window.skhs_db.getCollection('attendance');

    let presents = 0;
    let absents = 0;

    sectionStudents.sort((a, b) => Number(a.rollNumber || 999) - Number(b.rollNumber || 999));

    sectionStudents.forEach(student => {
      const record = attendanceRecords.find(a => a.studentId === student.studentId && a.date === date);
      const currentStatus = record ? record.status : 'Present';

      if (currentStatus === 'Present') presents++;
      else if (currentStatus === 'Absent') absents++;

      const row = document.createElement('tr');
      row.setAttribute('data-student-id', student.studentId);
      row.innerHTML = `
        <td><strong>${student.rollNumber || '--'}</strong></td>
        <td>${student.fullName}</td>
        <td>
          <div style="display: flex; gap: 1rem;">
            <label style="cursor: pointer;"><input type="radio" name="status-${student.studentId}" value="Present" ${currentStatus === 'Present' ? 'checked' : ''}> Present</label>
            <label style="cursor: pointer; color: var(--portal-error);"><input type="radio" name="status-${student.studentId}" value="Absent" ${currentStatus === 'Absent' ? 'checked' : ''}> Absent</label>
            <label style="cursor: pointer; color: var(--portal-warning);"><input type="radio" name="status-${student.studentId}" value="Leave" ${currentStatus === 'Leave' ? 'checked' : ''}> Leave</label>
          </div>
        </td>
      `;
      rosterBody.appendChild(row);
    });

    const total = sectionStudents.length;
    const presentPct = Math.round((presents / total) * 100);
    const absentPct = Math.round((absents / total) * 100);
    updateAnalytics(presentPct, absentPct);
  }

  function updateAnalytics(presentPct, absentPct) {
    const presentEl = document.getElementById('att-analytic-present');
    const absentEl = document.getElementById('att-analytic-absent');
    if (presentEl) presentEl.textContent = `${presentPct}%`;
    if (absentEl) absentEl.textContent = `${absentPct}%`;
  }
})();
