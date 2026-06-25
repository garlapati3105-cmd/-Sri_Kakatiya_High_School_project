// ============================================================
//  Sri Kakatiya School Management Platform – student/academics.js
//  Academics and Subjects Catalog Controller
// ============================================================

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') return;

    loadAcademicsData();
    window.addEventListener('skhs_db_synced', loadAcademicsData);
  });

  function loadAcademicsData() {
    const currentUser = window.skhs_auth.getCurrentUser();
    if (!currentUser) return;

    const student = window.skhs_db.findOne('students', 'userId', currentUser.userId || currentUser.id);
    if (!student) return;

    // FIX: use camelCase key 'classId'
    const subjects = window.skhs_db.find('subjects', 'classId', student.classId);

    // FIX: use camelCase key 'studentId'
    const marks = window.skhs_db.find('marks', 'studentId', student.studentId);
    const subjectAverages = {};

    marks.forEach(m => {
      // FIX: use camelCase key 'examId'
      const exam = window.skhs_db.findOne('exams', 'examId', m.examId || m.exam_id);
      if (exam) {
        const subId = exam.subjectId || exam.subject_id;
        if (subId) {
          if (!subjectAverages[subId]) subjectAverages[subId] = { obtained: 0, max: 0 };
          subjectAverages[subId].obtained += m.marksObtained || m.marks_obtained || 0;
          subjectAverages[subId].max += m.maxMarks || m.max_marks || 100;
        }
      }
    });

    let strongName = 'None';
    let weakName = 'None';
    let maxPct = -1;
    let minPct = 101;

    Object.keys(subjectAverages).forEach(subId => {
      const score = subjectAverages[subId];
      if (score.max === 0) return;
      const pct = (score.obtained / score.max) * 100;
      // FIX: use camelCase key 'subjectId'
      const sub = window.skhs_db.findOne('subjects', 'subjectId', subId);
      if (sub) {
        if (pct > maxPct) { maxPct = pct; strongName = sub.name; }
        if (pct < minPct) { minPct = pct; weakName = sub.name; }
      }
    });

    const strongEl = document.getElementById('acad-strongest');
    const weakEl = document.getElementById('acad-weakest');
    if (strongEl) strongEl.textContent = strongName + (maxPct >= 0 ? ` (${Math.round(maxPct)}%)` : '');
    if (weakEl) weakEl.textContent = weakName + (minPct <= 100 && minPct >= 0 ? ` (${Math.round(minPct)}%)` : '');

    renderSubjectsGrid(subjects, subjectAverages);
  }

  function renderSubjectsGrid(subjects, averages) {
    const grid = document.getElementById('academics-subjects-grid');
    if (!grid) return;

    if (subjects.length === 0) {
      grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--portal-text-muted);">No academic subjects setup for your class.</p>`;
      return;
    }

    grid.innerHTML = '';
    subjects.forEach(sub => {
      // FIX: use camelCase 'teacherId'
      const teacher = window.skhs_db.findOne('teachers', 'teacherId', sub.teacherId || sub.teacher_id);
      // FIX: use camelCase 'subjectId'
      const score = averages[sub.subjectId || sub.subject_id];
      const avgStr = score && score.max > 0
        ? `${Math.round((score.obtained / score.max) * 100)}% Average`
        : 'No Marks Recorded';

      const card = document.createElement('div');
      card.className = 'portal-card';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '0.75rem';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h4 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 0.25rem;">${sub.name}</h4>
            <span style="font-size: 0.75rem; color: var(--portal-text-muted);">ID: ${sub.subjectId || sub.subject_id}</span>
          </div>
          <span class="badge ${score ? 'badge-info' : 'badge-neutral'}">${avgStr}</span>
        </div>
        <div style="border-top: 1px solid var(--portal-border); padding-top: 0.75rem; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.75rem;">
          <div style="font-size: 1.75rem;">👨‍🏫</div>
          <div>
            <div style="font-size: 0.85rem; font-weight: 600;">${teacher ? teacher.fullName : 'Class Faculty'}</div>
            <div style="font-size: 0.7rem; color: var(--portal-text-muted);">${teacher ? teacher.qualification || 'Educator' : 'Assigned Teacher'}</div>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }
})();
