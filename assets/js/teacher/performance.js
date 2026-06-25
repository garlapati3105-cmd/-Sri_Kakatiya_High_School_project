// ============================================================
//  Sri Kakatiya School Management Platform – teacher/performance.js
//  Teacher Student Performance Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'teacher') return;

    populateStudentsSelector();
    setupListeners();

    window.addEventListener('skhs_db_synced', populateStudentsSelector);
  });

  function populateStudentsSelector() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const teacher = window.skhs_db.findOne('teachers', 'userId', currentUser.userId || currentUser.id);
    if (!teacher) return;

    const select = document.getElementById('perf-student-select');
    if (!select) return;

    const assignedClasses = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [];
    const studentsCollection = window.skhs_db.getCollection('students');

    select.innerHTML = '<option value="">-- Choose Student --</option>';
    assignedClasses.forEach(classId => {
      const classRecord = window.skhs_db.findOne('classes', 'classId', classId);
      const className = classRecord ? classRecord.name : classId;

      const classStudents = studentsCollection.filter(s => s.classId === classId);
      classStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.studentId;
        option.textContent = `${student.fullName} (${className})`;
        select.appendChild(option);
      });
    });
  }

  function setupListeners() {
    const select = document.getElementById('perf-student-select');
    if (select) {
      select.addEventListener('change', () => {
        const studentId = select.value;
        const displayArea = document.getElementById('perf-display-area');

        if (!studentId) {
          if (displayArea) displayArea.style.display = 'none';
          return;
        }

        loadPerformanceMetrics(studentId);
        if (displayArea) displayArea.style.display = 'block';
      });
    }
  }

  function loadPerformanceMetrics(studentId) {
    const student = window.skhs_db.findOne('students', 'studentId', studentId);
    if (!student) return;

    // 1. Attendance Rate
    const attRecords = window.skhs_db.find('attendance', 'studentId', studentId);
    let attPct = 100;
    if (attRecords.length > 0) {
      const presents = attRecords.filter(r => r.status === 'Present').length;
      attPct = Math.round((presents / attRecords.length) * 100);
    }
    const attEl = document.getElementById('perf-att-pct');
    if (attEl) {
      attEl.textContent = `${attPct}%`;
      attEl.style.color = attPct >= 75 ? 'var(--portal-success)' : 'var(--portal-error)';
    }

    // 2. Homework Rate
    const hws = window.skhs_db.find('homework', 'classId', student.classId);
    let hwPct = 100;
    if (hws.length > 0) {
      const completed = hws.filter(h => {
        const list = Array.isArray(h.completedStudents)
          ? h.completedStudents
          : String(h.completedStudents || '').split(',').map(s => s.trim()).filter(Boolean);
        return list.includes(studentId);
      }).length;
      hwPct = Math.round((completed / hws.length) * 100);
    }
    const hwEl = document.getElementById('perf-hw-pct');
    if (hwEl) {
      hwEl.textContent = `${hwPct}%`;
      hwEl.style.color = hwPct >= 75 ? 'var(--portal-info)' : 'var(--portal-warning)';
    }

    // 3. Exam Score Average
    const marks = window.skhs_db.find('marks', 'studentId', studentId);
    let scoreAvg = 80; // Fallback
    if (marks.length > 0) {
      let obtainedSum = 0;
      let maxSum = 0;
      marks.forEach(m => {
        obtainedSum += m.marksObtained || m.marks_obtained || 0;
        maxSum += m.maxMarks || m.max_marks || 100;
      });
      scoreAvg = maxSum > 0 ? Math.round((obtainedSum / maxSum) * 100) : 0;
    }
    const examEl = document.getElementById('perf-exam-avg');
    if (examEl) {
      examEl.textContent = `${scoreAvg}%`;
    }

    // Suggestions Block
    const suggestionsText = document.getElementById('perf-suggestions-text');
    if (suggestionsText) {
      let message = `Student <strong>${student.fullName}</strong> is showing consistent performance. `;
      if (attPct < 75) {
        message += `⚠️ Attendance is currently below 75% (${attPct}%). Attendance regularisation is critically required. `;
      }
      if (hwPct < 75) {
        message += `✍️ Homework submission rate (${hwPct}%) is low. Ensure submissions are turned in on time. `;
      }
      if (scoreAvg < 50) {
        message += `❌ Scorecard averages are low (${scoreAvg}%). Recommend special remediation classes and peer mentoring.`;
      } else if (scoreAvg >= 85) {
        message += `👑 Outstanding academic achievement! Maintain the current level of excellence.`;
      } else {
        message += `👍 Satisfactory class standing. Focus on resolving weaker areas before the final examinations.`;
      }
      suggestionsText.innerHTML = message;
    }
  }
})();
