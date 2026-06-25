// ============================================================
//  Sri Kakatiya School Management Platform – student/exams.js
//  Result Center and Exam Scorecard Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    loadExamsData();
    window.addEventListener('skhs_db_synced', loadExamsData);
  });

  function loadExamsData() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const student = window.skhs_db.findOne('students', 'userId', currentUser.userId || currentUser.id);
    if (!student) return;

    const tbody = document.getElementById('exams-results-body');
    const perfContainer = document.getElementById('exams-subject-performance');
    if (!tbody || !perfContainer) return;

    // FIX: use camelCase key 'studentId'
    const marks = window.skhs_db.find('marks', 'studentId', student.studentId);
    if (marks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--portal-text-muted);">No exam results published yet.</td></tr>`;
      perfContainer.innerHTML = `<p style="text-align: center; color: var(--portal-text-muted);">No performance logs recorded.</p>`;
      return;
    }

    const markedExams = [];
    const subjectScores = {};

    marks.forEach(m => {
      // FIX: use camelCase 'examId'
      const exam = window.skhs_db.findOne('exams', 'examId', m.examId || m.exam_id);
      if (exam) {
        markedExams.push({ mark: m, exam });
        const subId = exam.subjectId || exam.subject_id;
        if (subId) {
          if (!subjectScores[subId]) subjectScores[subId] = { obtained: 0, max: 0 };
          subjectScores[subId].obtained += m.marksObtained || m.marks_obtained || 0;
          subjectScores[subId].max += m.maxMarks || m.max_marks || 100;
        }
      }
    });

    // 1. Render Table Rows
    tbody.innerHTML = '';
    markedExams
      .sort((a, b) => new Date(b.exam.date) - new Date(a.exam.date))
      .forEach(item => {
        const subId = item.exam.subjectId || item.exam.subject_id;
        // FIX: use camelCase 'subjectId'
        const sub = window.skhs_db.findOne('subjects', 'subjectId', subId);
        const obtained = item.mark.marksObtained || item.mark.marks_obtained || 0;
        const maxMarks = item.mark.maxMarks || item.mark.max_marks || 100;
        const pct = maxMarks > 0 ? Math.round((obtained / maxMarks) * 100) : 0;

        let grade = 'F';
        if (pct >= 90) grade = 'A+';
        else if (pct >= 80) grade = 'A';
        else if (pct >= 70) grade = 'B';
        else if (pct >= 60) grade = 'C';
        else if (pct >= 50) grade = 'D';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${item.exam.name}</strong><br><small style="color:var(--portal-text-muted);">${item.exam.date}</small></td>
          <td>${sub ? sub.name : 'General'}</td>
          <td><strong>${obtained}</strong></td>
          <td>${maxMarks}</td>
          <td><strong>${pct}%</strong></td>
          <td><span class="badge ${pct >= 75 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-critical'}">${grade}</span></td>
        `;
        tbody.appendChild(row);
      });

    // 2. Render Subject-wise progress bars
    perfContainer.innerHTML = '';
    Object.keys(subjectScores).forEach(subId => {
      const score = subjectScores[subId];
      if (score.max === 0) return;
      const pct = Math.round((score.obtained / score.max) * 100);
      // FIX: use camelCase 'subjectId'
      const sub = window.skhs_db.findOne('subjects', 'subjectId', subId);
      const subName = sub ? sub.name : 'General';

      const progressBlock = document.createElement('div');
      progressBlock.style.margin = '0.5rem 0';
      progressBlock.style.display = 'flex';
      progressBlock.style.flexDirection = 'column';
      progressBlock.style.gap = '0.25rem';

      progressBlock.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 500;">
          <span>${subName}</span>
          <span style="font-weight: 700;">${pct}%</span>
        </div>
        <div style="background: var(--portal-border); height: 10px; border-radius: 5px; overflow: hidden; position: relative;">
          <div style="background: ${pct >= 75 ? 'var(--portal-success)' : pct >= 50 ? 'var(--portal-warning)' : 'var(--portal-error)'}; width: ${pct}%; height: 100%; transition: width 0.5s ease-in-out;"></div>
        </div>
      `;
      perfContainer.appendChild(progressBlock);
    });
  }
})();
