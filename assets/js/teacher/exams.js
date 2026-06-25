// ============================================================
//  Sri Kakatiya School Management Platform – teacher/exams.js
//  Teacher Examination & Student Marks Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'teacher') return;

    populateExamParameters();
    setupListeners();

    window.addEventListener('skhs_db_synced', populateExamParameters);
  });

  function populateExamParameters() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const teacher = window.skhs_db.findOne('teachers', 'userId', currentUser.userId || currentUser.id);
    if (!teacher) return;

    const examSelect = document.getElementById('exam-select');
    const classSelect = document.getElementById('exam-class-select');
    const subSelect = document.getElementById('exam-subject-select');

    if (!examSelect || !classSelect || !subSelect) return;

    // Load Exams
    const exams = window.skhs_db.getCollection('exams');
    const assignedClasses = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [];
    const teacherExams = exams.filter(e => assignedClasses.includes(e.classId));
    
    examSelect.innerHTML = '';
    // Unique list of exam names/types
    const seenNames = new Set();
    teacherExams.forEach(e => {
      if (!seenNames.has(e.name)) {
        seenNames.add(e.name);
        const option = document.createElement('option');
        option.value = e.name;
        option.textContent = e.name;
        examSelect.appendChild(option);
      }
    });

    // Fallback if no exams
    if (seenNames.size === 0) {
      const defaultOption = document.createElement('option');
      defaultOption.value = "Quarterly Exam";
      defaultOption.textContent = "Quarterly Exam";
      examSelect.appendChild(defaultOption);
      const defaultOption2 = document.createElement('option');
      defaultOption2.value = "Unit Test 1";
      defaultOption2.textContent = "Unit Test 1";
      examSelect.appendChild(defaultOption2);
    }

    // Load Classes
    classSelect.innerHTML = '';
    assignedClasses.forEach(classId => {
      const classRecord = window.skhs_db.findOne('classes', 'classId', classId);
      const option = document.createElement('option');
      option.value = classId;
      option.textContent = classRecord ? classRecord.name : classId;
      classSelect.appendChild(option);
    });

    // Load Subjects
    const subjects = window.skhs_db.find('subjects', 'teacherId', teacher.teacherId);
    subSelect.innerHTML = '';
    subjects.forEach(s => {
      const option = document.createElement('option');
      option.value = s.subjectId;
      option.textContent = s.name;
      subSelect.appendChild(option);
    });
  }

  function setupListeners() {
    const loadBtn = document.getElementById('btn-load-exam-students');
    const saveBtn = document.getElementById('btn-save-marks');
    const rosterBody = document.getElementById('exam-scoresheet-body');
    const alertContainer = document.getElementById('dashboard-alert-container');
    const showAlert = (msg, type) => window.skhs_dom.showAlert(alertContainer, msg, type, 4000);

    if (loadBtn) {
      loadBtn.addEventListener('click', () => {
        const examName = document.getElementById('exam-select').value;
        const classId = document.getElementById('exam-class-select').value;
        const subjectId = document.getElementById('exam-subject-select').value;

        if (!examName || !classId || !subjectId) {
          showAlert("Please configure all search filters.", "error");
          return;
        }

        loadScoresheet(examName, classId, subjectId);
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const examName = document.getElementById('exam-select').value;
        const classId = document.getElementById('exam-class-select').value;
        const subjectId = document.getElementById('exam-subject-select').value;
        const rows = rosterBody.querySelectorAll('tr[data-student-id]');

        if (rows.length === 0) {
          showAlert("No scoresheet loaded to save.", "error");
          return;
        }

        // Find or create Exam model record
        let exam = window.skhs_db.getCollection('exams').find(e => e.name === examName && e.classId === classId && e.subjectId === subjectId);
        const isPublished = document.getElementById('exam-publish-checkbox').checked;

        if (!exam) {
          exam = {
            examId: window.createId('EXM'),
            name: examName,
            type: examName.includes("Unit") ? "Unit Test" : "Terminal",
            classId: classId,
            subjectId: subjectId,
            date: new Date().toISOString().split('T')[0],
            published: isPublished,
            academicYear: "AY-2026-27"
          };
          await window.skhs_db.insert('exams', exam);
        } else {
          await window.skhs_db.update('exams', 'examId', exam.examId, { published: isPublished });
        }

        const marksRecords = window.skhs_db.getCollection('marks');
        let savedCount = 0;

        for (const row of rows) {
          const studentId = row.getAttribute('data-student-id');
          const markVal = Number(row.querySelector('input.exam-mark-input').value) || 0;
          const remarksVal = row.querySelector('input.exam-remarks-input').value.trim();

          const existingMark = marksRecords.find(m => m.examId === exam.examId && m.studentId === studentId);
          if (existingMark) {
            await window.skhs_db.update('marks', 'markId', existingMark.markId, {
              marksObtained: markVal,
              remarks: remarksVal
            });
          } else {
            await window.skhs_db.insert('marks', {
              markId: window.createId('MRK'),
              examId: exam.examId,
              studentId: studentId,
              marksObtained: markVal,
              maxMarks: examName.includes("Unit") ? 25 : 100,
              remarks: remarksVal,
              academicYear: "AY-2026-27"
            });
          }
          savedCount++;
        }

        showAlert(`Successfully saved scoresheet records for ${savedCount} students.`, "success");
        window.dispatchEvent(new Event('skhs_db_synced'));
        loadScoresheet(examName, classId, subjectId);
      });
    }
  }

  function loadScoresheet(examName, classId, subjectId) {
    const rosterBody = document.getElementById('exam-scoresheet-body');
    if (!rosterBody) return;

    const maxMarks = examName.includes("Unit") ? 25 : 100;
    const maxMarksLabel = document.getElementById('exam-max-marks-label');
    if (maxMarksLabel) maxMarksLabel.textContent = maxMarks;

    const students = window.skhs_db.find('students', 'classId', classId);
    if (students.length === 0) {
      rosterBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--portal-text-muted);">No students registered in this class.</td></tr>`;
      calculateStats([]);
      return;
    }

    // Find exam ID
    const exam = window.skhs_db.getCollection('exams').find(e => e.name === examName && e.classId === classId && e.subjectId === subjectId);
    const marksRecords = window.skhs_db.getCollection('marks');

    rosterBody.innerHTML = '';
    const scores = [];

    // Publish state
    const publishCheckbox = document.getElementById('exam-publish-checkbox');
    if (publishCheckbox) {
      publishCheckbox.checked = exam ? exam.published : false;
    }

    students.sort((a, b) => Number(a.rollNumber || 999) - Number(b.rollNumber || 999));

    students.forEach(student => {
      const markRecord = exam ? marksRecords.find(m => m.examId === exam.examId && m.studentId === student.studentId) : null;
      const scoreObtained = markRecord ? (markRecord.marksObtained || markRecord.marks_obtained || 0) : 0;
      const remarks = markRecord ? (markRecord.remarks || '') : '';

      scores.push(scoreObtained);

      const row = document.createElement('tr');
      row.setAttribute('data-student-id', student.studentId);
      row.innerHTML = `
        <td><strong>${student.rollNumber || '--'}</strong></td>
        <td>${student.fullName}</td>
        <td>
          <input type="number" class="form-input exam-mark-input" min="0" max="${maxMarks}" value="${scoreObtained}" style="max-width: 100px;">
        </td>
        <td>
          <input type="text" class="form-input exam-remarks-input" value="${remarks}" placeholder="e.g. Excellent work">
        </td>
      `;
      rosterBody.appendChild(row);
    });

    calculateStats(scores, maxMarks);
  }

  function calculateStats(scores, maxMarks = 100) {
    const highestEl = document.getElementById('exam-stat-highest');
    const lowestEl = document.getElementById('exam-stat-lowest');
    const averageEl = document.getElementById('exam-stat-average');
    const passPctEl = document.getElementById('exam-stat-pass-pct');

    if (!highestEl || !lowestEl || !averageEl || !passPctEl) return;

    if (scores.length === 0) {
      highestEl.textContent = '--';
      lowestEl.textContent = '--';
      averageEl.textContent = '--';
      passPctEl.textContent = '--%';
      return;
    }

    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    const sum = scores.reduce((a, b) => a + b, 0);
    const average = Math.round((sum / scores.length) * 10) / 10;

    const passBoundary = maxMarks * 0.35; // 35% pass mark
    const passes = scores.filter(s => s >= passBoundary).length;
    const passPct = Math.round((passes / scores.length) * 100);

    highestEl.textContent = `${highest} / ${maxMarks}`;
    lowestEl.textContent = `${lowest} / ${maxMarks}`;
    averageEl.textContent = `${average} / ${maxMarks}`;
    passPctEl.textContent = `${passPct}%`;
  }
})();
